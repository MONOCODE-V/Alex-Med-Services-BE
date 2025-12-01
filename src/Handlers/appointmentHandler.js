import { getPrisma } from '../db/prisma.js';
import ResponseHelper from '../utils/response.js';
import { 
  ValidationError, 
  NotFoundError,
  ConflictError 
} from '../utils/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import NotificationService from '../services/notificationService.js';

const bookAppointment = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;
  const { doctorId, clinicId, dateTime, notes } = req.body;

  // Validate required fields
  if (!doctorId || !dateTime) {
    throw new ValidationError('Doctor ID and appointment date/time are required');
  }

  const appointmentDate = new Date(dateTime);
  
  // Validate appointment is in the future
  if (appointmentDate <= new Date()) {
    throw new ValidationError('Appointment must be scheduled for a future date and time');
  }

  // Check if doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { 
      user: true,
      clinics: {
        where: clinicId ? { clinicId } : undefined,
        include: { clinic: true }
      }
    }
  });

  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  if (!doctor.user.isActive) {
    throw new ValidationError('Doctor account is not active');
  }

  // If clinic is specified, verify doctor works at that clinic
  if (clinicId) {
    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: { 
        doctorId,
        clinicId 
      }
    });

    if (!doctorClinic) {
      throw new ValidationError('Doctor does not work at the specified clinic');
    }
  }

  // Get doctor's schedule for the appointment day
  const dayOfWeek = appointmentDate.getDay();
  const appointmentTime = appointmentDate.toTimeString().slice(0, 5); // "HH:mm"

  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId,
      dayOfWeek,
      isActive: true,
      ...(clinicId && {
        doctorClinic: {
          clinicId
        }
      })
    },
    include: {
      doctorClinic: {
        include: {
          clinic: true
        }
      }
    }
  });

  if (schedules.length === 0) {
    throw new ValidationError('Doctor is not available on this day');
  }

  // Check if appointment time falls within any schedule
  const isWithinSchedule = schedules.some(schedule => {
    return appointmentTime >= schedule.startTime && appointmentTime < schedule.endTime;
  });

  if (!isWithinSchedule) {
    const availableTimes = schedules.map(s => 
      `${s.startTime} - ${s.endTime} at ${s.doctorClinic.clinic.name}`
    ).join(', ');
    throw new ValidationError(
      `Doctor is not available at ${appointmentTime}. Available times: ${availableTimes}`
    );
  }

  // Check for existing appointments at the same time
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId,
      dateTime: appointmentDate,
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    }
  });

  if (existingAppointment) {
    throw new ConflictError('This time slot is already booked. Please choose another time.');
  }

  // Check if patient already has an appointment with this doctor at the same time
  const patientConflict = await prisma.appointment.findFirst({
    where: {
      patientId,
      dateTime: appointmentDate,
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    }
  });

  if (patientConflict) {
    throw new ConflictError('You already have an appointment at this time');
  }

  // Create the appointment
  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      clinicId,
      dateTime: appointmentDate,
      notes,
      status: 'PENDING'
    },
    include: {
      doctor: {
        include: {
          user: true,
          specializations: {
            include: {
              specialization: true
            }
          }
        }
      },
      clinic: true,
      patient: {
        include: {
          user: true
        }
      }
    }
  });

  // Create notifications for both patient and doctor
  await NotificationService.createMany([
    {
      userId: appointment.patient.userId,
      role: 'PATIENT',
      type: 'APPOINTMENT_BOOKED',
      title: 'Appointment Booked',
      message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} is scheduled for ${appointmentDate.toLocaleString()}`,
      data: {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        dateTime: appointment.dateTime
      },
      priority: 'medium',
      category: 'APPOINTMENTS'
    },
    {
      userId: appointment.doctor.userId,
      role: 'DOCTOR',
      type: 'NEW_APPOINTMENT',
      title: 'New Appointment Request',
      message: `${appointment.patient.firstName} ${appointment.patient.lastName} booked an appointment for ${appointmentDate.toLocaleString()}`,
      data: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        dateTime: appointment.dateTime
      },
      priority: 'high',
      category: 'APPOINTMENTS'
    }
  ]);

  ResponseHelper.created({
    message: 'Appointment booked successfully',
    appointment: {
      id: appointment.id,
      dateTime: appointment.dateTime,
      status: appointment.status,
      notes: appointment.notes,
      doctor: {
        id: appointment.doctor.id,
        name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        specializations: appointment.doctor.specializations.map(s => s.specialization.name)
      },
      clinic: appointment.clinic ? {
        id: appointment.clinic.id,
        name: appointment.clinic.name,
        address: appointment.clinic.address,
        city: appointment.clinic.city
      } : null
    }
  }, res);
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;
  const { appointmentId } = req.params;
  const { reason } = req.body;

  // Find the appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id: parseInt(appointmentId) },
    include: {
      doctor: true,
      clinic: true
    }
  });

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  // Verify the appointment belongs to this patient
  if (appointment.patientId !== patientId) {
    throw new ValidationError('You can only cancel your own appointments');
  }

  // Check if appointment can be cancelled
  if (appointment.status === 'CANCELLED') {
    throw new ValidationError('This appointment is already cancelled');
  }

  if (appointment.status === 'COMPLETED') {
    throw new ValidationError('Cannot cancel a completed appointment');
  }

  // Check if appointment is in the past
  if (new Date(appointment.dateTime) < new Date()) {
    throw new ValidationError('Cannot cancel past appointments');
  }

  // Update appointment status
  const updatedAppointment = await prisma.appointment.update({
    where: { id: parseInt(appointmentId) },
    data: {
      status: 'CANCELLED',
      notes: reason ? `Cancelled: ${reason}` : appointment.notes
    },
    include: {
      doctor: true,
      clinic: true
    }
  });

  ResponseHelper.success({
    message: 'Appointment cancelled successfully',
    appointment: {
      id: updatedAppointment.id,
      dateTime: updatedAppointment.dateTime,
      status: updatedAppointment.status,
      doctor: {
        name: `Dr. ${updatedAppointment.doctor.firstName} ${updatedAppointment.doctor.lastName}`
      },
      clinic: updatedAppointment.clinic ? {
        name: updatedAppointment.clinic.name
      } : null
    }
  }, res);
});

const getMyAppointments = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;
  const { status, upcoming } = req.query;

  const where = {
    patientId
  };

  // Filter by status if provided
  if (status) {
    where.status = status.toUpperCase();
  }

  // Filter for upcoming appointments
  if (upcoming === 'true') {
    where.dateTime = {
      gte: new Date()
    };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { dateTime: 'desc' },
    include: {
      doctor: {
        include: {
          user: true,
          specializations: {
            include: {
              specialization: true
            }
          }
        }
      },
      clinic: true
    }
  });

  ResponseHelper.success({
    count: appointments.length,
    appointments: appointments.map(apt => ({
      id: apt.id,
      dateTime: apt.dateTime,
      status: apt.status,
      notes: apt.notes,
      doctor: {
        id: apt.doctor.id,
        name: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
        specializations: apt.doctor.specializations.map(s => s.specialization.name),
        yearsOfExperience: apt.doctor.yearsOfExperience
      },
      clinic: apt.clinic ? {
        id: apt.clinic.id,
        name: apt.clinic.name,
        address: apt.clinic.address,
        city: apt.clinic.city,
        area: apt.clinic.area
      } : null,
      createdAt: apt.createdAt
    }))
  }, res);
});

const getAppointmentById = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;
  const { appointmentId } = req.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: parseInt(appointmentId) },
    include: {
      doctor: {
        include: {
          user: true,
          specializations: {
            include: {
              specialization: true
            }
          }
        }
      },
      clinic: true,
      patient: {
        include: {
          user: true
        }
      }
    }
  });

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  // Verify the appointment belongs to this patient
  if (appointment.patientId !== patientId) {
    throw new ValidationError('You can only view your own appointments');
  }

  ResponseHelper.success({
    appointment: {
      id: appointment.id,
      dateTime: appointment.dateTime,
      status: appointment.status,
      notes: appointment.notes,
      doctor: {
        id: appointment.doctor.id,
        name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        specializations: appointment.doctor.specializations.map(s => ({
          id: s.specialization.id,
          name: s.specialization.name,
          nameEn: s.specialization.nameEn
        })),
        yearsOfExperience: appointment.doctor.yearsOfExperience,
        bio: appointment.doctor.bio
      },
      clinic: appointment.clinic ? {
        id: appointment.clinic.id,
        name: appointment.clinic.name,
        address: appointment.clinic.address,
        city: appointment.clinic.city,
        area: appointment.clinic.area,
        phone: appointment.clinic.phone,
        mapUrl: appointment.clinic.mapUrl
      } : null,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    }
  }, res);
});

const getDoctorAvailableSlots = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { doctorId } = req.params;
  const { date, clinicId } = req.query;

  if (!date) {
    throw new ValidationError('Date parameter is required');
  }

  const requestedDate = new Date(date);
  const dayOfWeek = requestedDate.getDay();

  // Get doctor's schedules for this day
  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId: parseInt(doctorId),
      dayOfWeek,
      isActive: true,
      ...(clinicId && {
        doctorClinic: {
          clinicId: parseInt(clinicId)
        }
      })
    },
    include: {
      doctorClinic: {
        include: {
          clinic: true
        }
      }
    }
  });

  if (schedules.length === 0) {
    return ResponseHelper.success({
      date: requestedDate,
      availableSlots: [],
      message: 'Doctor is not available on this day'
    }, res);
  }

  // Get existing appointments for this date
  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(requestedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: parseInt(doctorId),
      dateTime: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    }
  });

  const bookedTimes = new Set(
    existingAppointments.map(apt => apt.dateTime.toTimeString().slice(0, 5))
  );

  // Generate available slots (30-minute intervals)
  const availableSlots = [];
  
  schedules.forEach(schedule => {
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      
      if (!bookedTimes.has(timeSlot)) {
        const slotDateTime = new Date(requestedDate);
        slotDateTime.setHours(currentHour, currentMinute, 0, 0);
        
        // Only include future slots
        if (slotDateTime > new Date()) {
          availableSlots.push({
            time: timeSlot,
            dateTime: slotDateTime,
            clinic: {
              id: schedule.doctorClinic.clinic.id,
              name: schedule.doctorClinic.clinic.name,
              address: schedule.doctorClinic.clinic.address
            }
          });
        }
      }
      
      // Increment by 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour += 1;
      }
    }
  });

  ResponseHelper.success({
    date: requestedDate,
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
    availableSlots,
    totalSlots: availableSlots.length
  }, res);
});

export { 
  bookAppointment, 
  cancelAppointment, 
  getMyAppointments, 
  getAppointmentById,
  getDoctorAvailableSlots
};
