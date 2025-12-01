import express from 'express';
import { authenticateDoctor } from '../../Middlewares/auth.js';
import { getDoctorNotifications } from '../../Handlers/doctor/notificationHandler.js';

const router = express.Router();

// Get all notifications for doctor
router.get('/', authenticateDoctor, getDoctorNotifications);

export default router;
