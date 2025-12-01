import express from 'express';
import { authenticateDoctor } from '../../Middlewares/auth.js';
import { 
  addMySpecialization, 
  getMySpecializations, 
  updateMySpecialization,
  removeMySpecialization
} from '../../Handlers/doctor/doctorSpecializationHandler.js';

const router = express.Router();

// Get my specializations
router.get('/', authenticateDoctor, getMySpecializations);

// Add specialization to my profile
router.post('/', authenticateDoctor, addMySpecialization);

// Update specialization (set as primary)
router.patch('/:doctorSpecializationId', authenticateDoctor, updateMySpecialization);

// Remove specialization from my profile
router.delete('/:doctorSpecializationId', authenticateDoctor, removeMySpecialization);

export default router;
