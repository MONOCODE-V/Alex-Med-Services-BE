import { getPrisma } from '../db/prisma.js';
import ResponseHelper from '../utils/response.js';
import { 
  ValidationError, 
  NotFoundError,
  ConflictError 
} from '../utils/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Patient creates a review for a doctor
 */
const createReview = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;
  const { doctorId, rating, comment } = req.body;

  // Validate required fields
  if (!doctorId || !rating) {
    throw new ValidationError('Doctor ID and rating are required');
  }

  // Validate rating range
  if (rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }

  // Check if doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { user: true }
  });

  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  if (!doctor.user.isActive) {
    throw new ValidationError('Cannot review inactive doctor');
  }

  // Check if patient has completed appointment with this doctor
  const completedAppointment = await prisma.appointment.findFirst({
    where: {
      patientId,
      doctorId,
      status: 'COMPLETED'
    }
  });

  if (!completedAppointment) {
    throw new ValidationError('You can only review doctors you have visited');
  }

  // Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: {
      patientId_doctorId: {
        patientId,
        doctorId
      }
    }
  });

  if (existingReview) {
    throw new ConflictError('You have already reviewed this doctor. Use update instead.');
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      patientId,
      doctorId,
      rating: parseFloat(rating),
      comment
    },
    include: {
      patient: {
        include: {
          user: true
        }
      }
    }
  });

  ResponseHelper.created({
    message: 'Review submitted successfully',
    review: {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      patient: {
        name: `${review.patient.firstName} ${review.patient.lastName}`
      },
      createdAt: review.createdAt
    }
  }, res);
});

/**
 * Get all reviews for a specific doctor (public)
 */
const getDoctorReviews = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { doctorId } = req.params;
  const { limit, offset } = req.query;

  // Verify doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: parseInt(doctorId) },
    include: { user: true }
  });

  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  // Get reviews with pagination
  const take = limit ? parseInt(limit) : 10;
  const skip = offset ? parseInt(offset) : 0;

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where: { doctorId: parseInt(doctorId) },
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    prisma.review.count({
      where: { doctorId: parseInt(doctorId) }
    })
  ]);

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Rating distribution
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  };

  ResponseHelper.success({
    doctor: {
      id: doctor.id,
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`
    },
    summary: {
      totalReviews: totalCount,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingDistribution
    },
    reviews: reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      patient: {
        name: `${review.patient.firstName} ${review.patient.lastName.charAt(0)}.`
      },
      createdAt: review.createdAt
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
 * Get patient's own reviews
 */
const getMyReviews = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;

  const reviews = await prisma.review.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
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
      }
    }
  });

  ResponseHelper.success({
    totalReviews: reviews.length,
    reviews: reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      doctor: {
        id: review.doctor.id,
        name: `Dr. ${review.doctor.firstName} ${review.doctor.lastName}`,
        specializations: review.doctor.specializations.map(s => s.specialization.name)
      },
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }))
  }, res);
});

/**
 * Update patient's review
 */
const updateReview = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  // Find review and verify ownership
  const review = await prisma.review.findUnique({
    where: { id: parseInt(reviewId) },
    include: { doctor: true }
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  if (review.patientId !== patientId) {
    throw new ValidationError('You can only update your own reviews');
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 5)) {
    throw new ValidationError('Rating must be between 1 and 5');
  }

  // Update review
  const updateData = {};
  if (rating) updateData.rating = parseFloat(rating);
  if (comment !== undefined) updateData.comment = comment;

  const updatedReview = await prisma.review.update({
    where: { id: parseInt(reviewId) },
    data: updateData,
    include: {
      doctor: true
    }
  });

  ResponseHelper.success({
    message: 'Review updated successfully',
    review: {
      id: updatedReview.id,
      rating: updatedReview.rating,
      comment: updatedReview.comment,
      doctor: {
        name: `Dr. ${updatedReview.doctor.firstName} ${updatedReview.doctor.lastName}`
      },
      updatedAt: updatedReview.updatedAt
    }
  }, res);
});

/**
 * Delete patient's review
 */
const deleteReview = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const patientId = req.user.patient.id;
  const { reviewId } = req.params;

  // Find review and verify ownership
  const review = await prisma.review.findUnique({
    where: { id: parseInt(reviewId) }
  });

  if (!review) {
    throw new NotFoundError('Review not found');
  }

  if (review.patientId !== patientId) {
    throw new ValidationError('You can only delete your own reviews');
  }

  await prisma.review.delete({
    where: { id: parseInt(reviewId) }
  });

  ResponseHelper.success({
    message: 'Review deleted successfully'
  }, res);
});

export { 
  createReview, 
  getDoctorReviews, 
  getMyReviews, 
  updateReview, 
  deleteReview 
};
