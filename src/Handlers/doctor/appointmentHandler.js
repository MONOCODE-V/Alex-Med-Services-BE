import { getPrisma } from '../../db/prisma.js';
import ResponseHelper from '../../utils/response.js';
import { 
  ValidationError, 
  NotFoundError 
} from '../../utils/errorHandler.js';
import asyncHandler from '../../utils/asyncHandler.js';
import NotificationService from '../../services/notificationService.js';

const getTodayAppointments = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: {
        gte: today,
        lt: tomorrow
      },
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    },
    orderBy: { dateTime: 'asc' },
    include: {
      patient: {
        include: {
          user: true
        }
      },
      clinic: true
    }
  });

  // Get medical history for each patient
  const appointmentsWithHistory = await Promise.all(
    appointments.map(async (appointment) => {
      const patientId = appointment.patientId;

      // Get previous appointments with this doctor
      const previousAppointments = await prisma.appointment.findMany({
        where: {
          patientId,
          doctorId,
          dateTime: {
            lt: appointment.dateTime
          },
          status: {
            in: ['COMPLETED', 'CONFIRMED']
          }
        },
        orderBy: { dateTime: 'desc' },
        take: 5,
        select: {
          id: true,
          dateTime: true,
          status: true,
          notes: true
        }
      });

      // Check if first visit
      const isFirstVisit = previousAppointments.length === 0;

      // Get last visit date
      const lastVisit = previousAppointments.length > 0 
        ? previousAppointments[0].dateTime 
        : null;

      // Count total visits
      const totalVisits = await prisma.appointment.count({
        where: {
          patientId,
          doctorId,
          status: 'COMPLETED'
        }
      });

      return {
        id: appointment.id,
        dateTime: appointment.dateTime,
        status: appointment.status,
        notes: appointment.notes,
        clinic: appointment.clinic ? {
          id: appointment.clinic.id,
          name: appointment.clinic.name,
          area: appointment.clinic.area
        } : null,
        patient: {
          id: appointment.patient.id,
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          phone: appointment.patient.phone,
          email: appointment.patient.user.email,
          age: appointment.patient.dateOfBirth 
            ? calculateAge(appointment.patient.dateOfBirth) 
            : null,
          gender: appointment.patient.gender,
          address: appointment.patient.address
        },
        medicalHistory: {
          isFirstVisit,
          lastVisit,
          totalVisitsCompleted: totalVisits,
          previousVisits: previousAppointments.map(prev => ({
            date: prev.dateTime,
            status: prev.status,
            notes: prev.notes
          }))
        }
      };
    })
  );

  ResponseHelper.success({
    date: today,
    totalAppointments: appointmentsWithHistory.length,
    appointments: appointmentsWithHistory
  }, res);
});

const getPatientHistory = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { patientId } = req.params;

  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(patientId) },
    include: {
      user: true
    }
  });

  if (!patient) {
    throw new NotFoundError('Patient not found');
  }

  // Get all appointments with this doctor
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: parseInt(patientId),
      doctorId
    },
    orderBy: { dateTime: 'desc' },
    include: {
      clinic: true
    }
  });

  const completedVisits = appointments.filter(a => a.status === 'COMPLETED');
  const upcomingVisits = appointments.filter(a => 
    ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.dateTime) > new Date()
  );

  // Get reviews from this patient
  const reviews = await prisma.review.findMany({
    where: {
      patientId: parseInt(patientId),
      doctorId
    }
  });

  ResponseHelper.success({
    patient: {
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      email: patient.user.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      age: patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null,
      gender: patient.gender,
      address: patient.address
    },
    summary: {
      totalAppointments: appointments.length,
      completedVisits: completedVisits.length,
      upcomingVisits: upcomingVisits.length,
      cancelledVisits: appointments.filter(a => a.status === 'CANCELLED').length,
      firstVisit: appointments.length > 0 ? appointments[appointments.length - 1].dateTime : null,
      lastVisit: completedVisits.length > 0 ? completedVisits[0].dateTime : null
    },
    appointments: appointments.map(apt => ({
      id: apt.id,
      dateTime: apt.dateTime,
      status: apt.status,
      notes: apt.notes,
      clinic: apt.clinic ? {
        name: apt.clinic.name,
        area: apt.clinic.area
      } : null
    })),
    reviews: reviews.map(r => ({
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt
    }))
  }, res);
});

const getMyAppointments = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { status, date, clinicId } = req.query;

  const where = {
    doctorId
  };

  if (status) {
    where.status = status.toUpperCase();
  }

  if (date) {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    where.dateTime = {
      gte: selectedDate,
      lt: nextDay
    };
  }

  if (clinicId) {
    where.clinicId = parseInt(clinicId);
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { dateTime: 'asc' },
    include: {
      patient: {
        include: {
          user: true
        }
      },
      clinic: true
    }
  });

  ResponseHelper.success({
    totalAppointments: appointments.length,
    appointments: appointments.map(apt => ({
      id: apt.id,
      dateTime: apt.dateTime,
      status: apt.status,
      notes: apt.notes,
      patient: {
        id: apt.patient.id,
        name: `${apt.patient.firstName} ${apt.patient.lastName}`,
        phone: apt.patient.phone,
        email: apt.patient.user.email
      },
      clinic: apt.clinic ? {
        id: apt.clinic.id,
        name: apt.clinic.name,
        area: apt.clinic.area
      } : null
    }))
  }, res);
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { appointmentId } = req.params;
  const { status, notes } = req.body;

  // Validate status
  const validStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Find appointment and verify ownership
  const appointment = await prisma.appointment.findUnique({
    where: { id: parseInt(appointmentId) },
    include: {
      patient: true
    }
  });

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  if (appointment.doctorId !== doctorId) {
    throw new ValidationError('You can only update your own appointments');
  }

  const updateData = { status };
  if (notes) {
    updateData.notes = notes;
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id: parseInt(appointmentId) },
    data: updateData,
    include: {
      patient: {
        include: {
          user: true
        }
      },
      doctor: {
        include: {
          user: true
        }
      },
      clinic: true
    }
  });

  // Create notification for patient about status change
  const statusMessages = {
    'CONFIRMED': 'confirmed',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled'
  };

  await NotificationService.create({
    userId: updatedAppointment.patient.userId,
    role: 'PATIENT',
    type: `APPOINTMENT_${status}`,
    title: `Appointment ${statusMessages[status]}`,
    message: `Dr. ${updatedAppointment.doctor.firstName} ${updatedAppointment.doctor.lastName} ${statusMessages[status]} your appointment on ${new Date(updatedAppointment.dateTime).toLocaleString()}`,
    data: {
      appointmentId: updatedAppointment.id,
      doctorId: updatedAppointment.doctorId,
      status: updatedAppointment.status,
      dateTime: updatedAppointment.dateTime
    },
    priority: status === 'CANCELLED' ? 'high' : 'medium',
    category: 'APPOINTMENTS'
  });

  ResponseHelper.success({
    message: 'Appointment status updated successfully',
    appointment: {
      id: updatedAppointment.id,
      dateTime: updatedAppointment.dateTime,
      status: updatedAppointment.status,
      notes: updatedAppointment.notes,
      patient: {
        name: `${updatedAppointment.patient.firstName} ${updatedAppointment.patient.lastName}`,
        email: updatedAppointment.patient.user.email
      }
    }
  }, res);
});

// Helper function
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export { 
  getTodayAppointments, 
  getPatientHistory, 
  getMyAppointments,
  updateAppointmentStatus
};
