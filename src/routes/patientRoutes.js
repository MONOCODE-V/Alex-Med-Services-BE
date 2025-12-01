import express from 'express';
import { authenticatePatient } from '../Middlewares/auth.js';
import { 
  getMyProfile, 
  updateMyProfile, 
  getMyMedicalHistory,
  getUpcomingAppointments,
  getNotifications
} from '../Handlers/patientHandler.js';

const router = express.Router();

// Get my profile
router.get('/profile', authenticatePatient, getMyProfile);

// Update my profile
router.patch('/profile', authenticatePatient, updateMyProfile);

// Get my complete medical history
router.get('/medical-history', authenticatePatient, getMyMedicalHistory);

// Get upcoming appointments
router.get('/upcoming', authenticatePatient, getUpcomingAppointments);

// Get notifications
router.get('/notifications', authenticatePatient, getNotifications);

export default router;
