import express from 'express';
import { 
  getAllDoctors, 
  getDoctorById, 
  searchDoctors,
  getTopRatedDoctors
} from '../Handlers/publicDoctorHandler.js';

const router = express.Router();

// All routes are public
router.get('/', getAllDoctors);
router.get('/search', searchDoctors);
router.get('/top-rated', getTopRatedDoctors);
router.get('/:doctorId', getDoctorById);

export default router;
