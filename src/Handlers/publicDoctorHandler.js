import { getPrisma } from '../db/prisma.js';
import ResponseHelper from '../utils/response.js';
import { 
  ValidationError, 
  NotFoundError
} from '../utils/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Get all doctors with filters (Public)
 */
const getAllDoctors = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { 
    specialization, 
    city, 
    area, 
    minRating, 
    search,
    sortBy,
    limit, 
    offset 
  } = req.query;

  const where = {
    user: {
      isActive: true
    }
  };

  // Filter by specialization
  if (specialization) {
    where.specializations = {
      some: {
        specialization: {
          OR: [
            { name: { contains: specialization, mode: 'insensitive' } },
            { nameEn: { contains: specialization, mode: 'insensitive' } }
          ]
        }
      }
    };
  }

  // Filter by city/area
  if (city || area) {
    where.clinics = {
      some: {
        clinic: {
          ...(city && { city: { contains: city, mode: 'insensitive' } }),
          ...(area && { area: { contains: area, mode: 'insensitive' } })
        }
      }
    };
  }

  // Search by name
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const take = limit ? parseInt(limit) : 20;
  const skip = offset ? parseInt(offset) : 0;

  const [doctors, totalCount] = await Promise.all([
    prisma.doctor.findMany({
      where,
      take,
      skip,
      include: {
        user: {
          select: {
            email: true,
            isActive: true
          }
        },
        specializations: {
          include: {
            specialization: true
          }
        },
        clinics: {
          include: {
            clinic: true
          }
        },
        reviews: true,
        _count: {
          select: {
            appointments: true,
            reviews: true
          }
        }
      }
    }),
    prisma.doctor.count({ where })
  ]);

  // Calculate ratings and sort
  let doctorsWithRatings = doctors.map(doctor => {
    const avgRating = doctor.reviews.length > 0
      ? doctor.reviews.reduce((sum, r) => sum + r.rating, 0) / doctor.reviews.length
      : 0;

    return {
      id: doctor.id,
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      profileImage: doctor.profileImage,
      yearsOfExperience: doctor.yearsOfExperience,
      qualifications: doctor.qualifications,
      bio: doctor.bio,
      specializations: doctor.specializations.map(ds => ({
        id: ds.specialization.id,
        name: ds.specialization.name,
        nameEn: ds.specialization.nameEn,
        isPrimary: ds.isPrimary
      })),
      clinics: doctor.clinics.map(dc => ({
        id: dc.clinic.id,
        name: dc.clinic.name,
        city: dc.clinic.city,
        area: dc.clinic.area,
        address: dc.clinic.address,
        consultationFee: dc.consultationFee
      })),
      rating: {
        average: parseFloat(avgRating.toFixed(2)),
        total: doctor.reviews.length
      },
      totalAppointments: doctor._count.appointments,
      isActive: doctor.user.isActive
    };
  });

  // Filter by minimum rating
  if (minRating) {
    const minRatingNum = parseFloat(minRating);
    doctorsWithRatings = doctorsWithRatings.filter(d => d.rating.average >= minRatingNum);
  }

  // Sort results
  if (sortBy === 'rating') {
    doctorsWithRatings.sort((a, b) => b.rating.average - a.rating.average);
  } else if (sortBy === 'experience') {
    doctorsWithRatings.sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
  } else if (sortBy === 'reviews') {
    doctorsWithRatings.sort((a, b) => b.rating.total - a.rating.total);
  }

  ResponseHelper.success({
    totalDoctors: doctorsWithRatings.length,
    doctors: doctorsWithRatings,
    pagination: {
      total: totalCount,
      limit: take,
      offset: skip,
      hasMore: skip + take < totalCount
    }
  }, res);
});

/**
 * Get doctor profile by ID (Public)
 */
const getDoctorById = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { doctorId } = req.params;

  const doctor = await prisma.doctor.findUnique({
    where: { id: parseInt(doctorId) },
    include: {
      user: {
        select: {
          email: true,
          isActive: true,
          createdAt: true
        }
      },
      specializations: {
        include: {
          specialization: true
        },
        orderBy: [
          { isPrimary: 'desc' }
        ]
      },
      clinics: {
        include: {
          clinic: true,
          schedules: {
            where: {
              isActive: true
            },
            orderBy: [
              { dayOfWeek: 'asc' },
              { startTime: 'asc' }
            ]
          }
        }
      },
      reviews: {
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      },
      _count: {
        select: {
          appointments: true,
          reviews: true
        }
      }
    }
  });

  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  if (!doctor.user.isActive) {
    throw new ValidationError('This doctor profile is not active');
  }

  // Calculate rating statistics
  const avgRating = doctor.reviews.length > 0
    ? doctor.reviews.reduce((sum, r) => sum + r.rating, 0) / doctor.reviews.length
    : 0;

  const ratingDistribution = {
    5: doctor.reviews.filter(r => r.rating === 5).length,
    4: doctor.reviews.filter(r => r.rating === 4).length,
    3: doctor.reviews.filter(r => r.rating === 3).length,
    2: doctor.reviews.filter(r => r.rating === 2).length,
    1: doctor.reviews.filter(r => r.rating === 1).length
  };

  // Count completed appointments
  const completedAppointments = await prisma.appointment.count({
    where: {
      doctorId: parseInt(doctorId),
      status: 'COMPLETED'
    }
  });

  ResponseHelper.success({
    doctor: {
      id: doctor.id,
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      profileImage: doctor.profileImage,
      yearsOfExperience: doctor.yearsOfExperience,
      qualifications: doctor.qualifications,
      bio: doctor.bio,
      memberSince: doctor.user.createdAt,
      specializations: doctor.specializations.map(ds => ({
        id: ds.specialization.id,
        name: ds.specialization.name,
        nameEn: ds.specialization.nameEn,
        description: ds.specialization.description,
        isPrimary: ds.isPrimary
      })),
      clinics: doctor.clinics.map(dc => ({
        id: dc.clinic.id,
        name: dc.clinic.name,
        city: dc.clinic.city,
        area: dc.clinic.area,
        address: dc.clinic.address,
        phone: dc.clinic.phone,
        mapUrl: dc.clinic.mapUrl,
        consultationFee: dc.consultationFee,
        schedules: dc.schedules.map(s => ({
          id: s.id,
          dayOfWeek: getDayName(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime
        }))
      })),
      statistics: {
        totalAppointments: doctor._count.appointments,
        completedAppointments,
        totalReviews: doctor._count.reviews,
        averageRating: parseFloat(avgRating.toFixed(2)),
        ratingDistribution
      }
    },
    recentReviews: doctor.reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      patient: {
        name: `${review.patient.firstName} ${review.patient.lastName.charAt(0)}.`
      },
      createdAt: review.createdAt
    }))
  }, res);
});

/**
 * Search doctors (Public)
 */
const searchDoctors = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { q, limit } = req.query;

  if (!q || q.trim().length < 2) {
    throw new ValidationError('Search query must be at least 2 characters');
  }

  const searchTerm = q.trim();
  const take = limit ? parseInt(limit) : 10;

  const doctors = await prisma.doctor.findMany({
    where: {
      user: {
        isActive: true
      },
      OR: [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        {
          specializations: {
            some: {
              specialization: {
                OR: [
                  { name: { contains: searchTerm, mode: 'insensitive' } },
                  { nameEn: { contains: searchTerm, mode: 'insensitive' } }
                ]
              }
            }
          }
        }
      ]
    },
    take,
    include: {
      specializations: {
        include: {
          specialization: true
        }
      },
      clinics: {
        include: {
          clinic: {
            select: {
              city: true,
              area: true
            }
          }
        }
      },
      reviews: true
    }
  });

  const results = doctors.map(doctor => {
    const avgRating = doctor.reviews.length > 0
      ? doctor.reviews.reduce((sum, r) => sum + r.rating, 0) / doctor.reviews.length
      : 0;

    return {
      id: doctor.id,
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      specializations: doctor.specializations.map(ds => ds.specialization.name),
      locations: [...new Set(doctor.clinics.map(dc => `${dc.clinic.area}, ${dc.clinic.city}`))],
      averageRating: parseFloat(avgRating.toFixed(2)),
      totalReviews: doctor.reviews.length
    };
  });

  ResponseHelper.success({
    query: searchTerm,
    totalResults: results.length,
    results
  }, res);
});

/**
 * Get top-rated doctors (Public)
 */
const getTopRatedDoctors = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { limit, minReviews } = req.query;

  const take = limit ? parseInt(limit) : 10;
  const minReviewCount = minReviews ? parseInt(minReviews) : 5;

  const doctors = await prisma.doctor.findMany({
    where: {
      user: {
        isActive: true
      }
    },
    include: {
      specializations: {
        include: {
          specialization: true
        }
      },
      clinics: {
        include: {
          clinic: true
        }
      },
      reviews: true
    }
  });

  // Calculate ratings and filter by minimum reviews
  const doctorsWithRatings = doctors
    .map(doctor => {
      const avgRating = doctor.reviews.length > 0
        ? doctor.reviews.reduce((sum, r) => sum + r.rating, 0) / doctor.reviews.length
        : 0;

      return {
        id: doctor.id,
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        profileImage: doctor.profileImage,
        yearsOfExperience: doctor.yearsOfExperience,
        specializations: doctor.specializations.map(ds => ({
          name: ds.specialization.name,
          isPrimary: ds.isPrimary
        })),
        clinics: doctor.clinics.map(dc => ({
          name: dc.clinic.name,
          city: dc.clinic.city,
          area: dc.clinic.area
        })),
        rating: {
          average: parseFloat(avgRating.toFixed(2)),
          total: doctor.reviews.length
        }
      };
    })
    .filter(d => d.rating.total >= minReviewCount)
    .sort((a, b) => {
      // Sort by rating first, then by review count
      if (b.rating.average !== a.rating.average) {
        return b.rating.average - a.rating.average;
      }
      return b.rating.total - a.rating.total;
    })
    .slice(0, take);

  ResponseHelper.success({
    totalDoctors: doctorsWithRatings.length,
    minReviewsRequired: minReviewCount,
    doctors: doctorsWithRatings
  }, res);
});

// Helper function
function getDayName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

export { 
  getAllDoctors, 
  getDoctorById, 
  searchDoctors,
  getTopRatedDoctors
};
