import express from 'express';
import { authenticateToken } from '../Middlewares/auth.js';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getNotificationById
} from '../Handlers/notificationHandler.js';

const router = express.Router();

// All routes require authentication (works for all roles)
router.use(authenticateToken);

// Get all notifications with filters and pagination
router.get('/', getMyNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Get single notification by ID
router.get('/:id', getNotificationById);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Delete all read notifications
router.delete('/read/all', deleteAllRead);

export default router;
