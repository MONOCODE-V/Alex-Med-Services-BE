import express from 'express';
import { authenticateAdmin } from '../../Middlewares/auth.js';
import { 
  getAllUsers, 
  updateUserStatus, 
  getDashboard,
  getAllAppointments,
  deleteUser
} from '../../Handlers/admin/adminHandler.js';

const router = express.Router();

// All routes require admin authentication
router.get('/dashboard', authenticateAdmin, getDashboard);
router.get('/users', authenticateAdmin, getAllUsers);
router.patch('/users/:userId/status', authenticateAdmin, updateUserStatus);
router.delete('/users/:userId', authenticateAdmin, deleteUser);
router.get('/appointments', authenticateAdmin, getAllAppointments);

export default router;
