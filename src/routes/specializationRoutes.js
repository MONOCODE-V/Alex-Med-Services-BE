import express from 'express';
import { authenticateAdmin } from '../Middlewares/auth.js';
import { 
  createSpecialization, 
  getAllSpecializations, 
  getSpecializationById,
  updateSpecialization,
  deleteSpecialization
} from '../Handlers/specializationHandler.js';

const router = express.Router();

// Public routes
router.get('/', getAllSpecializations);
router.get('/:specializationId', getSpecializationById);

// Admin routes
router.post('/', authenticateAdmin, createSpecialization);
router.patch('/:specializationId', authenticateAdmin, updateSpecialization);
router.delete('/:specializationId', authenticateAdmin, deleteSpecialization);

export default router;
