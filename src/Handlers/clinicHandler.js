import { getPrisma } from '../db/prisma.js';
import ResponseHelper from '../utils/response.js';
import { 
  ValidationError, 
  NotFoundError,
  ConflictError
} from '../utils/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Create a new clinic (Admin only)
 */
const createClinic = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { name, city, area, address, phone, mapUrl } = req.body;

  // Validate required fields
  if (!name || !city || !area || !address) {
    throw new ValidationError('Name, city, area, and address are required');
  }

  // Check if clinic with same name and area exists
  const existing = await prisma.clinic.findFirst({
    where: {
      name,
      area,
      city
    }
  });

  if (existing) {
    throw new ConflictError('Clinic with this name already exists in this area');
  }

  const clinic = await prisma.clinic.create({
    data: {
      name,
      city,
      area,
      address,
      phone,
      mapUrl
    }
  });

  ResponseHelper.created({
    message: 'Clinic created successfully',
    clinic
  }, res);
});

/**
 * Get all clinics with filters (Public)
 */
const getAllClinics = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { city, area, search, limit, offset } = req.query;

  const where = {};
  
  if (city) {
    where.city = city;
  }
  
  if (area) {
    where.area = area;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } }
    ];
  }

  const take = limit ? parseInt(limit) : 20;
  const skip = offset ? parseInt(offset) : 0;

  const [clinics, totalCount] = await Promise.all([
    prisma.clinic.findMany({
      where,
      take,
      skip,
      orderBy: [
        { city: 'asc' },
        { area: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { doctors: true }
        }
      }
    }),
    prisma.clinic.count({ where })
  ]);

  // Get unique cities and areas for filters
  const allClinics = await prisma.clinic.findMany({
    select: {
      city: true,
      area: true
    }
  });

  const cities = [...new Set(allClinics.map(c => c.city))].sort();
  const areas = [...new Set(allClinics.map(c => c.area))].sort();

  ResponseHelper.success({
    totalClinics: totalCount,
    clinics: clinics.map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      city: clinic.city,
      area: clinic.area,
      address: clinic.address,
      phone: clinic.phone,
      mapUrl: clinic.mapUrl,
      doctorCount: clinic._count.doctors
    })),
    pagination: {
      total: totalCount,
      limit: take,
      offset: skip,
      hasMore: skip + take < totalCount
    },
    filters: {
      availableCities: cities,
      availableAreas: areas
    }
  }, res);
});

/**
 * Get clinic by ID with doctors (Public)
 */
const getClinicById = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { clinicId } = req.params;

  const clinic = await prisma.clinic.findUnique({
    where: { id: parseInt(clinicId) },
    include: {
      doctors: {
        include: {
          doctor: {
            include: {
              user: true,
              specializations: {
                include: {
                  specialization: true
                }
              },
              reviews: true,
              schedules: {
                where: {
                  doctorClinic: {
                    clinicId: parseInt(clinicId)
                  },
                  isActive: true
                }
              }
            }
          }
        }
      },
      appointments: {
        where: {
          dateTime: {
            gte: new Date()
          },
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        take: 5,
        orderBy: {
          dateTime: 'asc'
        }
      }
    }
  });

  if (!clinic) {
    throw new NotFoundError('Clinic not found');
  }

  // Format doctors with their info
  const doctors = clinic.doctors.map(dc => {
    const doctor = dc.doctor;
    const avgRating = doctor.reviews.length > 0
      ? doctor.reviews.reduce((sum, r) => sum + r.rating, 0) / doctor.reviews.length
      : 0;

    return {
      id: doctor.id,
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      specializations: doctor.specializations.map(ds => ({
        id: ds.specialization.id,
        name: ds.specialization.name,
        nameEn: ds.specialization.nameEn,
        isPrimary: ds.isPrimary
      })),
      yearsOfExperience: doctor.yearsOfExperience,
      consultationFee: dc.consultationFee,
      averageRating: parseFloat(avgRating.toFixed(2)),
      totalReviews: doctor.reviews.length,
      hasActiveSchedule: doctor.schedules.length > 0
    };
  });

  ResponseHelper.success({
    clinic: {
      id: clinic.id,
      name: clinic.name,
      city: clinic.city,
      area: clinic.area,
      address: clinic.address,
      phone: clinic.phone,
      mapUrl: clinic.mapUrl,
      totalDoctors: doctors.length,
      upcomingAppointments: clinic.appointments.length
    },
    doctors
  }, res);
});

/**
 * Update clinic (Admin only)
 */
const updateClinic = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { clinicId } = req.params;
  const { name, city, area, address, phone, mapUrl } = req.body;

  const clinic = await prisma.clinic.findUnique({
    where: { id: parseInt(clinicId) }
  });

  if (!clinic) {
    throw new NotFoundError('Clinic not found');
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (city) updateData.city = city;
  if (area) updateData.area = area;
  if (address) updateData.address = address;
  if (phone !== undefined) updateData.phone = phone;
  if (mapUrl !== undefined) updateData.mapUrl = mapUrl;

  const updated = await prisma.clinic.update({
    where: { id: parseInt(clinicId) },
    data: updateData
  });

  ResponseHelper.success({
    message: 'Clinic updated successfully',
    clinic: updated
  }, res);
});

/**
 * Delete clinic (Admin only)
 */
const deleteClinic = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { clinicId } = req.params;

  const clinic = await prisma.clinic.findUnique({
    where: { id: parseInt(clinicId) },
    include: {
      _count: {
        select: { 
          doctors: true,
          appointments: true
        }
      }
    }
  });

  if (!clinic) {
    throw new NotFoundError('Clinic not found');
  }

  if (clinic._count.doctors > 0) {
    throw new ValidationError(
      `Cannot delete clinic with ${clinic._count.doctors} assigned doctors. Remove doctor assignments first.`
    );
  }

  if (clinic._count.appointments > 0) {
    throw new ValidationError(
      `Cannot delete clinic with existing appointments (${clinic._count.appointments}). Archive it instead.`
    );
  }

  await prisma.clinic.delete({
    where: { id: parseInt(clinicId) }
  });

  ResponseHelper.success({
    message: 'Clinic deleted successfully'
  }, res);
});

export { 
  createClinic, 
  getAllClinics, 
  getClinicById,
  updateClinic,
  deleteClinic
};
