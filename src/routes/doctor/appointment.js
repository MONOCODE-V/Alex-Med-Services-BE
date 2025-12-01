import express from 'express';
import { authenticateDoctor } from '../../Middlewares/auth.js';
import { 
  getTodayAppointments, 
  getPatientHistory, 
  getMyAppointments,
  updateAppointmentStatus
} from '../../Handlers/doctor/appointmentHandler.js';

const router = express.Router();

// Get today's appointments with patient data and medical history
router.get('/today', authenticateDoctor, getTodayAppointments);

// Get all my appointments (with filters)
router.get('/', authenticateDoctor, getMyAppointments);

// Get specific patient's medical history with this doctor
router.get('/patient/:patientId/history', authenticateDoctor, getPatientHistory);

// Update appointment status
router.patch('/:appointmentId/status', authenticateDoctor, updateAppointmentStatus);

export default router;
