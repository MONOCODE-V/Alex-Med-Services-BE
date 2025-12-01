import express from 'express';
import { authenticateDoctor } from '../../Middlewares/auth.js';
import { 
  addMyClinic, 
  getMyClinics, 
  updateMyClinic,
  removeMyClinic
} from '../../Handlers/doctor/doctorClinicHandler.js';

const router = express.Router();

// Get my clinics
router.get('/', authenticateDoctor, getMyClinics);

// Add clinic to my profile
router.post('/', authenticateDoctor, addMyClinic);

// Update clinic assignment (consultation fee)
router.patch('/:doctorClinicId', authenticateDoctor, updateMyClinic);

// Remove clinic from my profile
router.delete('/:doctorClinicId', authenticateDoctor, removeMyClinic);

export default router;
