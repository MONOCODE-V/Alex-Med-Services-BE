import { getPrisma } from '../../db/prisma.js';
import ResponseHelper from '../../utils/response.js';
import { 
  ValidationError, 
  NotFoundError 
} from '../../utils/errorHandler.js';
import asyncHandler from '../../utils/asyncHandler.js';

const createSingleSchedule = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { clinicId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

  // Validate required fields
  if (!clinicId || dayOfWeek === undefined || !startTime || !endTime) {
    throw new ValidationError('clinicId, dayOfWeek, startTime, and endTime are required');
  }

  // Convert day name to number if string is provided
  let dayNum = dayOfWeek;
  if (typeof dayOfWeek === 'string') {
    const dayMap = {
      'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
      'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
    };
    dayNum = dayMap[dayOfWeek.toUpperCase()];
    if (dayNum === undefined) {
      throw new ValidationError('Invalid day of week');
    }
  }

  if (dayNum < 0 || dayNum > 6) {
    throw new ValidationError('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
  }

  // Validate time format and logic
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    throw new ValidationError('Time must be in HH:mm format');
  }

  if (startTime >= endTime) {
    throw new ValidationError('Start time must be before end time');
  }

  // Find the doctor clinic association
  const doctorClinic = await prisma.doctorClinic.findFirst({
    where: { 
      doctorId,
      clinicId: parseInt(clinicId)
    },
    include: { clinic: true }
  });

  if (!doctorClinic) {
    throw new ValidationError('You are not associated with this clinic. Please contact admin.');
  }

  // Create schedule
  const createdSchedule = await prisma.doctorSchedule.create({
    data: {
      doctorId,
      doctorClinicId: doctorClinic.id,
      dayOfWeek: dayNum,
      startTime,
      endTime,
      isActive: true
    },
    include: {
      doctorClinic: {
        include: {
          clinic: true
        }
      }
    }
  });

  ResponseHelper.created({
    message: 'Schedule created successfully',
    schedule: {
      id: createdSchedule.id,
      clinic: createdSchedule.doctorClinic.clinic.name,
      dayOfWeek: getDayName(createdSchedule.dayOfWeek),
      startTime: createdSchedule.startTime,
      endTime: createdSchedule.endTime,
      isActive: createdSchedule.isActive
    }
  }, res);
});

const createWeekSchedule = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { schedules, weekStartDate } = req.body;

  // Validate required fields
  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    throw new ValidationError('Schedules array is required');
  }

  if (!weekStartDate) {
    throw new ValidationError('Week start date is required');
  }

  // Validate each schedule entry
  for (const schedule of schedules) {
    const { doctorClinicId, dayOfWeek, startTime, endTime } = schedule;
    
    if (!doctorClinicId || dayOfWeek === undefined || !startTime || !endTime) {
      throw new ValidationError('Each schedule must have doctorClinicId, dayOfWeek, startTime, and endTime');
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new ValidationError('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
    }

    // Verify doctorClinic belongs to this doctor
    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: {
        id: doctorClinicId,
        doctorId
      }
    });

    if (!doctorClinic) {
      throw new ValidationError(`Doctor clinic ID ${doctorClinicId} not found or does not belong to you`);
    }

    // Validate time format and logic
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      throw new ValidationError('Time must be in HH:mm format');
    }

    if (startTime >= endTime) {
      throw new ValidationError('Start time must be before end time');
    }
  }

  // Store week start date for tracking
  const weekStart = new Date(weekStartDate);
  
  // Create schedules
  const createdSchedules = await Promise.all(
    schedules.map(schedule =>
      prisma.doctorSchedule.create({
        data: {
          doctorId,
          doctorClinicId: schedule.doctorClinicId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isActive: true
        },
        include: {
          doctorClinic: {
            include: {
              clinic: true
            }
          }
        }
      })
    )
  );

  // Update doctor's last schedule update
  await prisma.doctor.update({
    where: { id: doctorId },
    data: { updatedAt: new Date() }
  });

  ResponseHelper.created({
    message: 'Week schedule created successfully',
    weekStartDate: weekStart,
    schedules: createdSchedules.map(s => ({
      id: s.id,
      clinic: s.doctorClinic.clinic.name,
      dayOfWeek: getDayName(s.dayOfWeek),
      startTime: s.startTime,
      endTime: s.endTime,
      isActive: s.isActive
    }))
  }, res);
});

const getMySchedules = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { clinicId, isActive } = req.query;

  const where = {
    doctorId
  };

  if (clinicId) {
    where.doctorClinic = {
      clinicId: parseInt(clinicId)
    };
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const schedules = await prisma.doctorSchedule.findMany({
    where,
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ],
    include: {
      doctorClinic: {
        include: {
          clinic: true
        }
      }
    }
  });

  // Group by day of week
  const schedulesByDay = schedules.reduce((acc, schedule) => {
    const dayName = getDayName(schedule.dayOfWeek);
    if (!acc[dayName]) {
      acc[dayName] = [];
    }
    acc[dayName].push({
      id: schedule.id,
      clinic: {
        id: schedule.doctorClinic.clinic.id,
        name: schedule.doctorClinic.clinic.name,
        area: schedule.doctorClinic.clinic.area
      },
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isActive: schedule.isActive
    });
    return acc;
  }, {});

  ResponseHelper.success({
    totalSchedules: schedules.length,
    schedulesByDay
  }, res);
});

const updateSchedule = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { scheduleId } = req.params;
  const { startTime, endTime, isActive } = req.body;

  // Find schedule and verify ownership
  const schedule = await prisma.doctorSchedule.findUnique({
    where: { id: parseInt(scheduleId) },
    include: {
      doctorClinic: {
        include: {
          clinic: true
        }
      }
    }
  });

  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  if (schedule.doctorId !== doctorId) {
    throw new ValidationError('You can only update your own schedules');
  }

  // Validate times if provided
  if (startTime && endTime) {
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      throw new ValidationError('Time must be in HH:mm format');
    }
    if (startTime >= endTime) {
      throw new ValidationError('Start time must be before end time');
    }
  }

  const updateData = {};
  if (startTime) updateData.startTime = startTime;
  if (endTime) updateData.endTime = endTime;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedSchedule = await prisma.doctorSchedule.update({
    where: { id: parseInt(scheduleId) },
    data: updateData,
    include: {
      doctorClinic: {
        include: {
          clinic: true
        }
      }
    }
  });

  ResponseHelper.success({
    message: 'Schedule updated successfully',
    schedule: {
      id: updatedSchedule.id,
      clinic: updatedSchedule.doctorClinic.clinic.name,
      dayOfWeek: getDayName(updatedSchedule.dayOfWeek),
      startTime: updatedSchedule.startTime,
      endTime: updatedSchedule.endTime,
      isActive: updatedSchedule.isActive
    }
  }, res);
});

const deleteSchedule = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { scheduleId } = req.params;

  // Find schedule and verify ownership
  const schedule = await prisma.doctorSchedule.findUnique({
    where: { id: parseInt(scheduleId) }
  });

  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  if (schedule.doctorId !== doctorId) {
    throw new ValidationError('You can only delete your own schedules');
  }

  await prisma.doctorSchedule.delete({
    where: { id: parseInt(scheduleId) }
  });

  ResponseHelper.success({
    message: 'Schedule deleted successfully'
  }, res);
});

const checkScheduleStatus = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;

  // Get doctor's last schedule update
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { updatedAt: true }
  });

  const lastUpdate = doctor.updatedAt;
  const now = new Date();
  const daysSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));

  // Check if schedules need update (more than 7 days)
  const needsUpdate = daysSinceUpdate >= 7;

  // Get current week schedules
  const schedules = await prisma.doctorSchedule.findMany({
    where: { doctorId, isActive: true },
    include: {
      doctorClinic: {
        include: {
          clinic: true
        }
      }
    }
  });

  ResponseHelper.success({
    lastScheduleUpdate: lastUpdate,
    daysSinceUpdate,
    needsUpdate,
    notification: needsUpdate 
      ? '⚠️ Please update your schedule for this week' 
      : '✅ Your schedule is up to date',
    activeSchedules: schedules.length,
    schedules: schedules.map(s => ({
      day: getDayName(s.dayOfWeek),
      clinic: s.doctorClinic.clinic.name,
      time: `${s.startTime} - ${s.endTime}`
    }))
  }, res);
});

// Helper functions
function isValidTimeFormat(time) {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

function getDayName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

export { 
  createSingleSchedule,
  createWeekSchedule, 
  getMySchedules, 
  updateSchedule, 
  deleteSchedule,
  checkScheduleStatus
};
