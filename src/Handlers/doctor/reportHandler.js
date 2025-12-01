import { getPrisma } from '../../db/prisma.js';
import ResponseHelper from '../../utils/response.js';
import { ValidationError } from '../../utils/errorHandler.js';
import asyncHandler from '../../utils/asyncHandler.js';

const getDailyReport = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { date } = req.query;

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: {
        gte: targetDate,
        lt: nextDay
      }
    },
    include: {
      patient: {
        include: {
          user: true
        }
      },
      clinic: true
    }
  });

  const statusBreakdown = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'PENDING').length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length
  };

  const clinicBreakdown = appointments.reduce((acc, apt) => {
    if (apt.clinic) {
      const clinicName = apt.clinic.name;
      acc[clinicName] = (acc[clinicName] || 0) + 1;
    }
    return acc;
  }, {});

  const firstTimePatients = [];
  const returningPatients = [];

  for (const apt of appointments) {
    const previousVisits = await prisma.appointment.count({
      where: {
        patientId: apt.patientId,
        doctorId,
        dateTime: {
          lt: apt.dateTime
        },
        status: 'COMPLETED'
      }
    });

    const patientInfo = {
      id: apt.patient.id,
      name: `${apt.patient.firstName} ${apt.patient.lastName}`,
      appointmentTime: apt.dateTime,
      status: apt.status
    };

    if (previousVisits === 0) {
      firstTimePatients.push(patientInfo);
    } else {
      returningPatients.push(patientInfo);
    }
  }

  ResponseHelper.success({
    date: targetDate,
    summary: {
      ...statusBreakdown,
      firstTimePatients: firstTimePatients.length,
      returningPatients: returningPatients.length
    },
    clinicBreakdown,
    firstTimePatients,
    returningPatients,
    appointments: appointments.map(apt => ({
      id: apt.id,
      time: apt.dateTime,
      status: apt.status,
      patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
      clinic: apt.clinic ? apt.clinic.name : 'N/A',
      notes: apt.notes
    }))
  }, res);
});

const getWeeklyReport = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { startDate } = req.query;

  const weekStart = startDate ? new Date(startDate) : getWeekStart(new Date());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: {
        gte: weekStart,
        lt: weekEnd
      }
    },
    include: {
      patient: true,
      clinic: true
    },
    orderBy: {
      dateTime: 'asc'
    }
  });

  // Daily breakdown
  const dailyStats = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(weekStart);
    currentDay.setDate(currentDay.getDate() + i);
    const dayName = days[currentDay.getDay()];
    
    const nextDay = new Date(currentDay);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const dayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.dateTime);
      return aptDate >= currentDay && aptDate < nextDay;
    });
    
    dailyStats[dayName] = {
      date: currentDay.toISOString().split('T')[0],
      total: dayAppointments.length,
      completed: dayAppointments.filter(a => a.status === 'COMPLETED').length,
      pending: dayAppointments.filter(a => a.status === 'PENDING').length,
      confirmed: dayAppointments.filter(a => a.status === 'CONFIRMED').length,
      cancelled: dayAppointments.filter(a => a.status === 'CANCELLED').length
    };
  }

  const totalRevenue = appointments
    .filter(a => a.status === 'COMPLETED')
    .reduce((sum, apt) => {
      return sum + (apt.clinic ? 200 : 0); // Default fee, should come from doctorClinic
    }, 0);

  const uniquePatients = new Set(appointments.map(a => a.patientId)).size;

  ResponseHelper.success({
    weekStart,
    weekEnd,
    summary: {
      totalAppointments: appointments.length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      pending: appointments.filter(a => a.status === 'PENDING').length,
      confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
      uniquePatients,
      estimatedRevenue: totalRevenue
    },
    dailyStats,
    clinicStats: appointments.reduce((acc, apt) => {
      if (apt.clinic) {
        const clinicName = apt.clinic.name;
        if (!acc[clinicName]) {
          acc[clinicName] = { total: 0, completed: 0, revenue: 0 };
        }
        acc[clinicName].total++;
        if (apt.status === 'COMPLETED') {
          acc[clinicName].completed++;
          acc[clinicName].revenue += 200;
        }
      }
      return acc;
    }, {})
  }, res);
});

const getMonthlyReport = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { year, month } = req.query;

  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

  const monthStart = new Date(targetYear, targetMonth, 1);
  const monthEnd = new Date(targetYear, targetMonth + 1, 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: {
        gte: monthStart,
        lt: monthEnd
      }
    },
    include: {
      patient: true,
      clinic: true
    }
  });

  const weeklyBreakdown = [];
  let currentWeekStart = new Date(monthStart);
  
  while (currentWeekStart < monthEnd) {
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
    
    const weekAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.dateTime);
      return aptDate >= currentWeekStart && aptDate < currentWeekEnd;
    });
    
    weeklyBreakdown.push({
      weekStart: currentWeekStart.toISOString().split('T')[0],
      weekEnd: currentWeekEnd.toISOString().split('T')[0],
      total: weekAppointments.length,
      completed: weekAppointments.filter(a => a.status === 'COMPLETED').length
    });
    
    currentWeekStart = currentWeekEnd;
  }

  ResponseHelper.success({
    month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
    summary: {
      totalAppointments: appointments.length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
      uniquePatients: new Set(appointments.map(a => a.patientId)).size
    },
    weeklyBreakdown
  }, res);
});

const getPatientStatistics = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;

  const allAppointments = await prisma.appointment.findMany({
    where: { doctorId },
    include: { patient: true }
  });

  const patientStats = allAppointments.reduce((acc, apt) => {
    const patientId = apt.patientId;
    if (!acc[patientId]) {
      acc[patientId] = {
        patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
        totalVisits: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        lastVisit: null
      };
    }
    
    acc[patientId].totalVisits++;
    if (apt.status === 'COMPLETED') acc[patientId].completed++;
    if (apt.status === 'CANCELLED') acc[patientId].cancelled++;
    
    if (!acc[patientId].lastVisit || apt.dateTime > acc[patientId].lastVisit) {
      acc[patientId].lastVisit = apt.dateTime;
    }
    
    return acc;
  }, {});

  const topPatients = Object.values(patientStats)
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 10);

  ResponseHelper.success({
    totalPatients: Object.keys(patientStats).length,
    topPatients,
    averageVisitsPerPatient: (allAppointments.length / Object.keys(patientStats).length).toFixed(2)
  }, res);
});

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

export { 
  getDailyReport, 
  getWeeklyReport, 
  getMonthlyReport,
  getPatientStatistics
};
