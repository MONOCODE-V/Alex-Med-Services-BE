import express from 'express';
import { authenticatePatient } from '../Middlewares/auth.js';
import { 
  createReview, 
  getDoctorReviews, 
  getMyReviews, 
  updateReview, 
  deleteReview 
} from '../Handlers/reviewHandler.js';

const router = express.Router();

// Public route - Get doctor reviews
router.get('/doctors/:doctorId/reviews', getDoctorReviews);

// Patient routes - require authentication
router.post('/', authenticatePatient, createReview);
router.get('/my-reviews', authenticatePatient, getMyReviews);
router.patch('/:reviewId', authenticatePatient, updateReview);
router.delete('/:reviewId', authenticatePatient, deleteReview);

export default router;
