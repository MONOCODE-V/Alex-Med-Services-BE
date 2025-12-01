import { getPrisma } from '../db/prisma.js';
import ResponseHelper from '../utils/response.js';
import { 
  ValidationError, 
  NotFoundError,
  ConflictError,
  AuthorizationError
} from '../utils/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Create a new specialization (Admin only)
 */
const createSpecialization = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { name, nameEn, description, icon } = req.body;

  // Validate required fields
  if (!name) {
    throw new ValidationError('Specialization name (Arabic) is required');
  }

  // Check if specialization already exists
  const existing = await prisma.specialization.findUnique({
    where: { name }
  });

  if (existing) {
    throw new ConflictError('Specialization with this name already exists');
  }

  const specialization = await prisma.specialization.create({
    data: {
      name,
      nameEn,
      description,
      icon
    }
  });

  ResponseHelper.created({
    message: 'Specialization created successfully',
    specialization
  }, res);
});

/**
 * Get all specializations (Public)
 */
const getAllSpecializations = asyncHandler(async (req, res) => {
  const prisma = getPrisma();

  const specializations = await prisma.specialization.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { doctors: true }
      }
    }
  });

  ResponseHelper.success({
    totalSpecializations: specializations.length,
    specializations: specializations.map(spec => ({
      id: spec.id,
      name: spec.name,
      nameEn: spec.nameEn,
      description: spec.description,
      icon: spec.icon,
      doctorCount: spec._count.doctors
    }))
  }, res);
});

/**
 * Get single specialization with doctors (Public)
 */
const getSpecializationById = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { specializationId } = req.params;

  const specialization = await prisma.specialization.findUnique({
    where: { id: parseInt(specializationId) },
    include: {
      doctors: {
        include: {
          doctor: {
            include: {
              user: true,
              reviews: true,
              clinics: {
                include: {
                  clinic: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!specialization) {
    throw new NotFoundError('Specialization not found');
  }

  // Calculate average rating for each doctor
  const doctors = specialization.doctors.map(ds => {
    const doctor = ds.doctor;
    const avgRating = doctor.reviews.length > 0
      ? doctor.reviews.reduce((sum, r) => sum + r.rating, 0) / doctor.reviews.length
      : 0;

    return {
      id: doctor.id,
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      yearsOfExperience: doctor.yearsOfExperience,
      bio: doctor.bio,
      averageRating: parseFloat(avgRating.toFixed(2)),
      totalReviews: doctor.reviews.length,
      clinics: doctor.clinics.map(dc => ({
        id: dc.clinic.id,
        name: dc.clinic.name,
        area: dc.clinic.area,
        city: dc.clinic.city
      })),
      isPrimary: ds.isPrimary
    };
  });

  ResponseHelper.success({
    specialization: {
      id: specialization.id,
      name: specialization.name,
      nameEn: specialization.nameEn,
      description: specialization.description,
      icon: specialization.icon,
      totalDoctors: doctors.length
    },
    doctors
  }, res);
});

/**
 * Update specialization (Admin only)
 */
const updateSpecialization = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { specializationId } = req.params;
  const { name, nameEn, description, icon } = req.body;

  const specialization = await prisma.specialization.findUnique({
    where: { id: parseInt(specializationId) }
  });

  if (!specialization) {
    throw new NotFoundError('Specialization not found');
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (nameEn !== undefined) updateData.nameEn = nameEn;
  if (description !== undefined) updateData.description = description;
  if (icon !== undefined) updateData.icon = icon;

  const updated = await prisma.specialization.update({
    where: { id: parseInt(specializationId) },
    data: updateData
  });

  ResponseHelper.success({
    message: 'Specialization updated successfully',
    specialization: updated
  }, res);
});

/**
 * Delete specialization (Admin only)
 */
const deleteSpecialization = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { specializationId } = req.params;

  const specialization = await prisma.specialization.findUnique({
    where: { id: parseInt(specializationId) },
    include: {
      _count: {
        select: { doctors: true }
      }
    }
  });

  if (!specialization) {
    throw new NotFoundError('Specialization not found');
  }

  if (specialization._count.doctors > 0) {
    throw new ValidationError(
      `Cannot delete specialization with ${specialization._count.doctors} assigned doctors. Remove doctor assignments first.`
    );
  }

  await prisma.specialization.delete({
    where: { id: parseInt(specializationId) }
  });

  ResponseHelper.success({
    message: 'Specialization deleted successfully'
  }, res);
});

export { 
  createSpecialization, 
  getAllSpecializations, 
  getSpecializationById,
  updateSpecialization,
  deleteSpecialization
};
