import { getPrisma } from '../../db/prisma.js';
import ResponseHelper from '../../utils/response.js';
import { 
  ValidationError, 
  NotFoundError
} from '../../utils/errorHandler.js';
import asyncHandler from '../../utils/asyncHandler.js';
import NotificationService from '../../services/notificationService.js';

/**
 * Get all users with filters (Admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { role, isActive, search, limit, offset } = req.query;

  const where = {};
  
  if (role) {
    where.role = role.toUpperCase();
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } }
    ];
  }

  const take = limit ? parseInt(limit) : 50;
  const skip = offset ? parseInt(offset) : 0;

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            yearsOfExperience: true
          }
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            adminLevel: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  const formattedUsers = users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    profile: user.patient || user.doctor || user.admin || null
  }));

  ResponseHelper.success({
    totalUsers: totalCount,
    users: formattedUsers,
    pagination: {
      total: totalCount,
      limit: take,
      offset: skip,
      hasMore: skip + take < totalCount
    }
  }, res);
});

/**
 * Update user status (activate/deactivate)
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { userId } = req.params;
  const { isActive } = req.body;

  if (isActive === undefined) {
    throw new ValidationError('isActive field is required');
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent admin from deactivating themselves
  if (parseInt(userId) === req.user.id) {
    throw new ValidationError('You cannot change your own status');
  }

  const updated = await prisma.user.update({
    where: { id: parseInt(userId) },
    data: { isActive: isActive === true || isActive === 'true' },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  // Notify the user about status change
  const statusMessage = updated.isActive 
    ? 'Your account has been activated. You can now access all features.'
    : 'Your account has been deactivated. Please contact support for assistance.';

  await NotificationService.create({
    userId: updated.id,
    role: updated.role,
    type: updated.isActive ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED',
    title: `Account ${updated.isActive ? 'Activated' : 'Deactivated'}`,
    message: statusMessage,
    priority: updated.isActive ? 'medium' : 'high',
    category: 'ACCOUNT'
  });

  // Notify all admins about the status change
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', id: { not: req.user.id } },
    select: { id: true }
  });

  if (admins.length > 0) {
    await NotificationService.createMany(
      admins.map(admin => ({
        userId: admin.id,
        role: 'ADMIN',
        type: 'USER_STATUS_CHANGED',
        title: 'User Status Changed',
        message: `User ${updated.email} (${updated.role}) has been ${updated.isActive ? 'activated' : 'deactivated'} by ${req.user.email}`,
        priority: 'low',
        category: 'SYSTEM'
      }))
    );
  }

  ResponseHelper.success({
    message: `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
    user: updated
  }, res);
});

/**
 * Get system dashboard statistics
 */
const getDashboard = asyncHandler(async (req, res) => {
  const prisma = getPrisma();

  // Get counts
  const [
    totalUsers,
    activeUsers,
    totalDoctors,
    activeDoctors,
    totalPatients,
    totalAppointments,
    pendingAppointments,
    completedAppointments,
    totalReviews,
    totalClinics,
    totalSpecializations
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.doctor.count(),
    prisma.doctor.count({ where: { user: { isActive: true } } }),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'PENDING' } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.review.count(),
    prisma.clinic.count(),
    prisma.specialization.count()
  ]);

  // Get recent users
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      patient: { select: { firstName: true, lastName: true } },
      doctor: { select: { firstName: true, lastName: true } }
    }
  });

  // Get recent appointments
  const recentAppointments = await prisma.appointment.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      patient: { select: { firstName: true, lastName: true } },
      doctor: { select: { firstName: true, lastName: true } },
      clinic: { select: { name: true } }
    }
  });

  // Get appointments by status
  const appointmentsByStatus = await prisma.appointment.groupBy({
    by: ['status'],
    _count: true
  });

  // Get registrations by role
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  });

  // Get today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = await prisma.appointment.count({
    where: {
      dateTime: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  // Average rating
  const allReviews = await prisma.review.findMany({
    select: { rating: true }
  });
  const averageRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;

  ResponseHelper.success({
    overview: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalDoctors,
      activeDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalClinics,
      totalSpecializations
    },
    breakdown: {
      appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {})
    },
    recentActivity: {
      recentUsers: recentUsers.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        name: u.patient ? `${u.patient.firstName} ${u.patient.lastName}` 
              : u.doctor ? `Dr. ${u.doctor.firstName} ${u.doctor.lastName}`
              : 'Admin',
        createdAt: u.createdAt
      })),
      recentAppointments: recentAppointments.map(a => ({
        id: a.id,
        patient: `${a.patient.firstName} ${a.patient.lastName}`,
        doctor: `Dr. ${a.doctor.firstName} ${a.doctor.lastName}`,
        clinic: a.clinic?.name,
        dateTime: a.dateTime,
        status: a.status,
        createdAt: a.createdAt
      }))
    }
  }, res);
});

/**
 * Get all appointments overview (Admin)
 */
const getAllAppointments = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { status, date, clinicId, doctorId, limit, offset } = req.query;

  const where = {};
  
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
  
  if (doctorId) {
    where.doctorId = parseInt(doctorId);
  }

  const take = limit ? parseInt(limit) : 50;
  const skip = offset ? parseInt(offset) : 0;

  const [appointments, totalCount] = await Promise.all([
    prisma.appointment.findMany({
      where,
      take,
      skip,
      orderBy: { dateTime: 'desc' },
      include: {
        patient: {
          include: {
            user: {
              select: { email: true }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: { email: true }
            }
          }
        },
        clinic: true
      }
    }),
    prisma.appointment.count({ where })
  ]);

  ResponseHelper.success({
    totalAppointments: totalCount,
    appointments: appointments.map(apt => ({
      id: apt.id,
      dateTime: apt.dateTime,
      status: apt.status,
      notes: apt.notes,
      patient: {
        id: apt.patient.id,
        name: `${apt.patient.firstName} ${apt.patient.lastName}`,
        email: apt.patient.user.email
      },
      doctor: {
        id: apt.doctor.id,
        name: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
        email: apt.doctor.user.email
      },
      clinic: apt.clinic ? {
        id: apt.clinic.id,
        name: apt.clinic.name,
        area: apt.clinic.area
      } : null,
      createdAt: apt.createdAt
    })),
    pagination: {
      total: totalCount,
      limit: take,
      offset: skip,
      hasMore: skip + take < totalCount
    }
  }, res);
});

/**
 * Delete user (Admin only - with validation)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: {
      doctor: {
        include: {
          _count: {
            select: {
              appointments: true,
              schedules: true
            }
          }
        }
      },
      patient: {
        include: {
          _count: {
            select: {
              appointments: true,
              reviews: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent admin from deleting themselves
  if (parseInt(userId) === req.user.id) {
    throw new ValidationError('You cannot delete your own account');
  }

  // Check for related records
  if (user.doctor && (user.doctor._count.appointments > 0 || user.doctor._count.schedules > 0)) {
    throw new ValidationError(
      `Cannot delete doctor with ${user.doctor._count.appointments} appointments and ${user.doctor._count.schedules} schedules. Deactivate instead.`
    );
  }

  if (user.patient && (user.patient._count.appointments > 0 || user.patient._count.reviews > 0)) {
    throw new ValidationError(
      `Cannot delete patient with ${user.patient._count.appointments} appointments and ${user.patient._count.reviews} reviews. Deactivate instead.`
    );
  }

  await prisma.user.delete({
    where: { id: parseInt(userId) }
  });

  ResponseHelper.success({
    message: 'User deleted successfully'
  }, res);
});

export { 
  getAllUsers, 
  updateUserStatus, 
  getDashboard,
  getAllAppointments,
  deleteUser
};
