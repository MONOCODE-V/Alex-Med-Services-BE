import { getPrisma } from '../db/prisma.js';
import ResponseHelper from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

const getMyProfile = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      }
    }
  });

  if (!patient) {
    throw new NotFoundError('Patient profile not found');
  }

  ResponseHelper.success({
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      phone: patient.phone,
      user: patient.user
    }
  }, res);
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;
  const { firstName, lastName, dateOfBirth, gender, address, phone } = req.body;

  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
  if (gender) updateData.gender = gender.toUpperCase();
  if (address) updateData.address = address;
  if (phone) updateData.phone = phone;

  const updatedPatient = await prisma.patient.update({
    where: { id: patientId },
    data: updateData,
    include: {
      user: {
        select: {
          email: true,
          username: true
        }
      }
    }
  });

  ResponseHelper.success({
    message: 'Profile updated successfully',
    patient: updatedPatient
  }, res);
});

const getMyMedicalHistory = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;

  const appointments = await prisma.appointment.findMany({
    where: { patientId },
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

  const groupedByDoctor = appointments.reduce((acc, apt) => {
    const doctorId = apt.doctorId;
    const doctorName = `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`;
    
    if (!acc[doctorId]) {
      acc[doctorId] = {
        doctor: {
          id: doctorId,
          name: doctorName,
          specializations: apt.doctor.specializations.map(s => s.specialization.name)
        },
        visits: []
      };
    }
    
    acc[doctorId].visits.push({
      id: apt.id,
      dateTime: apt.dateTime,
      status: apt.status,
      notes: apt.notes,
      clinic: apt.clinic ? {
        name: apt.clinic.name,
        area: apt.clinic.area
      } : null
    });
    
    return acc;
  }, {});

  const summary = {
    totalAppointments: appointments.length,
    completedVisits: appointments.filter(a => a.status === 'COMPLETED').length,
    upcomingVisits: appointments.filter(a => 
      ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.dateTime) > new Date()
    ).length,
    cancelledVisits: appointments.filter(a => a.status === 'CANCELLED').length,
    doctorsSeen: Object.keys(groupedByDoctor).length
  };

  ResponseHelper.success({
    summary,
    historyByDoctor: Object.values(groupedByDoctor)
  }, res);
});

const getUpcomingAppointments = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;

  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: {
      patientId,
      dateTime: {
        gte: now
      },
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    },
    orderBy: { dateTime: 'asc' },
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
    totalUpcoming: appointments.length,
    appointments: appointments.map(apt => ({
      id: apt.id,
      dateTime: apt.dateTime,
      status: apt.status,
      notes: apt.notes,
      doctor: {
        id: apt.doctor.id,
        name: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
        specializations: apt.doctor.specializations.map(s => s.specialization.name)
      },
      clinic: apt.clinic ? {
        id: apt.clinic.id,
        name: apt.clinic.name,
        address: apt.clinic.address,
        area: apt.clinic.area,
        phone: apt.clinic.phone
      } : null
    }))
  }, res);
});

const getNotifications = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;

  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      patientId,
      dateTime: {
        gte: now,
        lte: in7Days
      },
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    },
    include: {
      doctor: true,
      clinic: true
    },
    orderBy: { dateTime: 'asc' }
  });

  const notifications = [];

  // Appointments within 24 hours
  const urgent = upcomingAppointments.filter(apt => new Date(apt.dateTime) <= in24Hours);
  urgent.forEach(apt => {
    const hoursUntil = Math.floor((new Date(apt.dateTime) - now) / (1000 * 60 * 60));
    notifications.push({
      type: 'URGENT',
      priority: 'high',
      message: `Appointment with Dr. ${apt.doctor.firstName} ${apt.doctor.lastName} in ${hoursUntil} hours`,
      appointmentId: apt.id,
      dateTime: apt.dateTime,
      clinic: apt.clinic?.name
    });
  });

  // Appointments within 7 days
  const upcoming = upcomingAppointments.filter(apt => 
    new Date(apt.dateTime) > in24Hours && new Date(apt.dateTime) <= in7Days
  );
  upcoming.forEach(apt => {
    const daysUntil = Math.ceil((new Date(apt.dateTime) - now) / (1000 * 60 * 60 * 24));
    notifications.push({
      type: 'REMINDER',
      priority: 'medium',
      message: `Appointment with Dr. ${apt.doctor.firstName} ${apt.doctor.lastName} in ${daysUntil} days`,
      appointmentId: apt.id,
      dateTime: apt.dateTime,
      clinic: apt.clinic?.name
    });
  });

  // Status updates (appointments confirmed by doctor today)
  const recentUpdates = await prisma.appointment.findMany({
    where: {
      patientId,
      status: 'CONFIRMED',
      updatedAt: {
        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
    },
    include: {
      doctor: true
    }
  });

  recentUpdates.forEach(apt => {
    notifications.push({
      type: 'STATUS_UPDATE',
      priority: 'low',
      message: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName} confirmed your appointment`,
      appointmentId: apt.id,
      dateTime: apt.dateTime
    });
  });

  ResponseHelper.success({
    totalNotifications: notifications.length,
    unreadCount: notifications.length,
    notifications: notifications.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
  }, res);
});

export { 
  getMyProfile, 
  updateMyProfile, 
  getMyMedicalHistory,
  getUpcomingAppointments,
  getNotifications
};
