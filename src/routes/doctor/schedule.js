import express from 'express';
import { authenticateDoctor } from '../../Middlewares/auth.js';
import { 
  createWeekSchedule,
  createSingleSchedule, 
  getMySchedules, 
  updateSchedule, 
  deleteSchedule,
  checkScheduleStatus
} from '../../Handlers/doctor/scheduleHandler.js';

const router = express.Router();

// Check if schedule needs update (notification endpoint)
router.get('/status', authenticateDoctor, checkScheduleStatus);

// Get all my schedules
router.get('/', authenticateDoctor, getMySchedules);

// Create single schedule
router.post('/', authenticateDoctor, createSingleSchedule);

// Create weekly schedule
router.post('/week', authenticateDoctor, createWeekSchedule);

// Update specific schedule
router.patch('/:scheduleId', authenticateDoctor, updateSchedule);

// Delete specific schedule
router.delete('/:scheduleId', authenticateDoctor, deleteSchedule);

export default router;
