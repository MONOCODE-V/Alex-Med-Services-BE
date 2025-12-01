import { getPrisma } from '../db/prisma';

async function addReview({ patientId, doctorId, rating, comment }) {
  const prisma = getPrisma();
  return prisma.review.create({ data: { patientId, doctorId, rating, comment } });
}

async function listDoctorReviews(doctorId) {
  const prisma = getPrisma();
  const reviews = await prisma.review.findMany({ where: { doctorId }, orderBy: { createdAt: 'desc' } });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return { averageRating: avg, count: reviews.length, reviews };
}

export default { addReview, listDoctorReviews };

