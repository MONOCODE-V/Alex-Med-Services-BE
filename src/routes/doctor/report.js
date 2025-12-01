import express from 'express';
import { authenticateDoctor } from '../../Middlewares/auth.js';
import { 
  getDailyReport, 
  getWeeklyReport, 
  getMonthlyReport,
  getPatientStatistics
} from '../../Handlers/doctor/reportHandler.js';

const router = express.Router();

// Daily report
router.get('/daily', authenticateDoctor, getDailyReport);

// Weekly report
router.get('/weekly', authenticateDoctor, getWeeklyReport);

// Monthly report
router.get('/monthly', authenticateDoctor, getMonthlyReport);

// Patient statistics
router.get('/patients', authenticateDoctor, getPatientStatistics);

export default router;
