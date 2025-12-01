import express from 'express';
import { 
  authenticateToken,
  authenticatePatient,
  authenticateDoctor,
  authenticateAdmin
} from '../Middlewares/auth.js';
import { 
  signup, 
  signin, 
  getProfile, 
  updateProfile,
  logout, 
  changePassword, 
  refreshToken 
} from '../Handlers/authHandler.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticateToken, getProfile);
router.patch('/profile', authenticateToken, updateProfile);
router.post('/logout', authenticateToken, logout);
router.post('/change-password', authenticateToken, changePassword);

export default router;

