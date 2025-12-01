import { getPrisma } from '../../db/prisma.js';
import ResponseHelper from '../../utils/response.js';
import asyncHandler from '../../utils/asyncHandler.js';

const getDoctorNotifications = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;

  const notifications = [];
  const now = new Date();

  // 1. CHECK SCHEDULE UPDATE NOTIFICATION (Weekly)
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { updatedAt: true }
  });

  const lastUpdate = doctor.updatedAt;
  const daysSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
  const needsScheduleUpdate = daysSinceUpdate >= 7;

  if (needsScheduleUpdate) {
    notifications.push({
      type: 'SCHEDULE_UPDATE',
      priority: 'high',
      message: `⚠️ Please update your weekly schedule (Last updated ${daysSinceUpdate} days ago)`,
      action: 'Update Schedule',
      category: 'SCHEDULE',
      daysOverdue: daysSinceUpdate - 7
    });
  }

  // 2. TODAY'S APPOINTMENTS REMINDER
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = await prisma.appointment.findMany({
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
    include: {
      patient: true
    }
  });

  if (todayAppointments.length > 0) {
    notifications.push({
      type: 'TODAY_APPOINTMENTS',
      priority: 'medium',
      message: `You have ${todayAppointments.length} appointment(s) today`,
      count: todayAppointments.length,
      category: 'APPOINTMENTS',
      appointments: todayAppointments.map(apt => ({
        id: apt.id,
        time: apt.dateTime,
        patient: `${apt.patient.firstName} ${apt.patient.lastName}`
      }))
    });
  }

  // 3. PENDING APPOINTMENTS (Need confirmation)
  const pendingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: 'PENDING',
      dateTime: {
        gte: now
      }
    },
    include: {
      patient: true
    },
    take: 5,
    orderBy: {
      dateTime: 'asc'
    }
  });

  if (pendingAppointments.length > 0) {
    notifications.push({
      type: 'PENDING_CONFIRMATION',
      priority: 'medium',
      message: `${pendingAppointments.length} appointment(s) awaiting your confirmation`,
      count: pendingAppointments.length,
      category: 'APPOINTMENTS',
      appointments: pendingAppointments.map(apt => ({
        id: apt.id,
        dateTime: apt.dateTime,
        patient: `${apt.patient.firstName} ${apt.patient.lastName}`
      }))
    });
  }

  // 4. UPCOMING APPOINTMENTS (Next 24 hours)
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: {
        gt: now,
        lte: in24Hours
      },
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    },
    include: {
      patient: true
    },
    orderBy: {
      dateTime: 'asc'
    }
  });

  if (upcomingAppointments.length > 0) {
    const nextAppointment = upcomingAppointments[0];
    const hoursUntil = Math.floor((new Date(nextAppointment.dateTime) - now) / (1000 * 60 * 60));
    
    notifications.push({
      type: 'UPCOMING_APPOINTMENT',
      priority: 'high',
      message: `Next appointment in ${hoursUntil} hours with ${nextAppointment.patient.firstName} ${nextAppointment.patient.lastName}`,
      appointmentId: nextAppointment.id,
      dateTime: nextAppointment.dateTime,
      category: 'APPOINTMENTS'
    });
  }

  // 5. NO SCHEDULE FOR UPCOMING DAYS
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId,
      isActive: true
    }
  });

  if (schedules.length === 0) {
    notifications.push({
      type: 'NO_SCHEDULE',
      priority: 'high',
      message: '⚠️ You have no active schedules. Patients cannot book appointments!',
      action: 'Create Schedule',
      category: 'SCHEDULE'
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  ResponseHelper.success({
    totalNotifications: notifications.length,
    unreadCount: notifications.length,
    needsScheduleUpdate,
    daysSinceLastScheduleUpdate: daysSinceUpdate,
    notifications,
    summary: {
      scheduleUpdateNeeded: needsScheduleUpdate,
      todayAppointments: todayAppointments.length,
      pendingConfirmations: pendingAppointments.length,
      upcomingIn24Hours: upcomingAppointments.length
    }
  }, res);
});

export { getDoctorNotifications };
