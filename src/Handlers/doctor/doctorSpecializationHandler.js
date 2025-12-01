import { getPrisma } from '../../db/prisma.js';
import ResponseHelper from '../../utils/response.js';
import { 
  ValidationError, 
  NotFoundError,
  ConflictError
} from '../../utils/errorHandler.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * Doctor assigns themselves a specialization
 */
const addMySpecialization = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { specializationId, isPrimary } = req.body;

  if (!specializationId) {
    throw new ValidationError('Specialization ID is required');
  }

  // Verify specialization exists
  const specialization = await prisma.specialization.findUnique({
    where: { id: parseInt(specializationId) }
  });

  if (!specialization) {
    throw new NotFoundError('Specialization not found');
  }

  // Check if already assigned
  const existing = await prisma.doctorSpecialization.findUnique({
    where: {
      doctorId_specializationId: {
        doctorId,
        specializationId: parseInt(specializationId)
      }
    }
  });

  if (existing) {
    throw new ConflictError('You already have this specialization assigned');
  }

  // If setting as primary, unset other primary specializations
  if (isPrimary) {
    await prisma.doctorSpecialization.updateMany({
      where: {
        doctorId,
        isPrimary: true
      },
      data: {
        isPrimary: false
      }
    });
  }

  const doctorSpec = await prisma.doctorSpecialization.create({
    data: {
      doctorId,
      specializationId: parseInt(specializationId),
      isPrimary: isPrimary || false
    },
    include: {
      specialization: true
    }
  });

  ResponseHelper.created({
    message: 'Specialization added successfully',
    specialization: {
      id: doctorSpec.id,
      specializationId: doctorSpec.specialization.id,
      name: doctorSpec.specialization.name,
      nameEn: doctorSpec.specialization.nameEn,
      isPrimary: doctorSpec.isPrimary
    }
  }, res);
});

/**
 * Get doctor's own specializations
 */
const getMySpecializations = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;

  const specializations = await prisma.doctorSpecialization.findMany({
    where: { doctorId },
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'asc' }
    ],
    include: {
      specialization: true
    }
  });

  ResponseHelper.success({
    totalSpecializations: specializations.length,
    specializations: specializations.map(ds => ({
      id: ds.id,
      specializationId: ds.specialization.id,
      name: ds.specialization.name,
      nameEn: ds.specialization.nameEn,
      description: ds.specialization.description,
      isPrimary: ds.isPrimary,
      assignedAt: ds.createdAt
    }))
  }, res);
});

/**
 * Update specialization (set as primary)
 */
const updateMySpecialization = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { doctorSpecializationId } = req.params;
  const { isPrimary } = req.body;

  // Verify ownership
  const doctorSpec = await prisma.doctorSpecialization.findUnique({
    where: { id: parseInt(doctorSpecializationId) },
    include: { specialization: true }
  });

  if (!doctorSpec) {
    throw new NotFoundError('Specialization assignment not found');
  }

  if (doctorSpec.doctorId !== doctorId) {
    throw new ValidationError('You can only update your own specializations');
  }

  // If setting as primary, unset other primary specializations
  if (isPrimary) {
    await prisma.doctorSpecialization.updateMany({
      where: {
        doctorId,
        isPrimary: true,
        id: { not: parseInt(doctorSpecializationId) }
      },
      data: {
        isPrimary: false
      }
    });
  }

  const updated = await prisma.doctorSpecialization.update({
    where: { id: parseInt(doctorSpecializationId) },
    data: { isPrimary: isPrimary || false },
    include: { specialization: true }
  });

  ResponseHelper.success({
    message: 'Specialization updated successfully',
    specialization: {
      id: updated.id,
      name: updated.specialization.name,
      isPrimary: updated.isPrimary
    }
  }, res);
});

/**
 * Remove doctor's specialization
 */
const removeMySpecialization = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { doctorSpecializationId } = req.params;

  // Verify ownership
  const doctorSpec = await prisma.doctorSpecialization.findUnique({
    where: { id: parseInt(doctorSpecializationId) }
  });

  if (!doctorSpec) {
    throw new NotFoundError('Specialization assignment not found');
  }

  if (doctorSpec.doctorId !== doctorId) {
    throw new ValidationError('You can only remove your own specializations');
  }

  await prisma.doctorSpecialization.delete({
    where: { id: parseInt(doctorSpecializationId) }
  });

  ResponseHelper.success({
    message: 'Specialization removed successfully'
  }, res);
});

export { 
  addMySpecialization, 
  getMySpecializations, 
  updateMySpecialization,
  removeMySpecialization
};
