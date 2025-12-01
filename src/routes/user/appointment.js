import express from 'express';
import { authenticatePatient } from '../../Middlewares/auth.js';
import { 
  bookAppointment, 
  cancelAppointment, 
  getMyAppointments, 
  getAppointmentById,
  getDoctorAvailableSlots
} from '../../Handlers/appointmentHandler.js';

const router = express.Router();

// Get available time slots for a doctor on a specific date
router.get('/available-slots/:doctorId', authenticatePatient, getDoctorAvailableSlots);

// Get all my appointments (with optional filters)
router.get('/my-appointments', authenticatePatient, getMyAppointments);

// Get specific appointment details
router.get('/:appointmentId', authenticatePatient, getAppointmentById);

// Book a new appointment
router.post('/book', authenticatePatient, bookAppointment);

// Cancel an appointment
router.patch('/:appointmentId/cancel', authenticatePatient, cancelAppointment);

export default router;
