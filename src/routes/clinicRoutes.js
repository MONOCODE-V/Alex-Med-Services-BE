import express from 'express';
import { authenticateAdmin } from '../Middlewares/auth.js';
import { 
  createClinic, 
  getAllClinics, 
  getClinicById,
  updateClinic,
  deleteClinic
} from '../Handlers/clinicHandler.js';

const router = express.Router();

// Public routes
router.get('/', getAllClinics);
router.get('/:clinicId', getClinicById);

// Admin routes
router.post('/', authenticateAdmin, createClinic);
router.patch('/:clinicId', authenticateAdmin, updateClinic);
router.delete('/:clinicId', authenticateAdmin, deleteClinic);

export default router;
