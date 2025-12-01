import NotificationService from '../services/notificationService.js';
import ResponseHelper from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Get all notifications for the authenticated user
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    unreadOnly = false,
    limit = 20,
    page = 1,
    category,
    priority
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const result = await NotificationService.getForUser(userId, {
    unreadOnly: unreadOnly === 'true',
    limit: parseInt(limit),
    offset,
    category,
    priority
  });

  ResponseHelper.success({
    notifications: result.notifications,
    pagination: {
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: result.hasMore
    },
    unreadCount: result.unread
  }, res);
});

/**
 * Get unread notification count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await NotificationService.getUnreadCount(userId);

  ResponseHelper.success({
    unreadCount: count
  }, res);
});

/**
 * Mark a notification as read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    throw new ValidationError('Valid notification ID is required');
  }

  const success = await NotificationService.markAsRead(parseInt(id), userId);

  if (!success) {
    throw new NotFoundError('Notification not found or already read');
  }

  ResponseHelper.success({
    message: 'Notification marked as read'
  }, res);
});

/**
 * Mark all notifications as read
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await NotificationService.markAllAsRead(userId);

  ResponseHelper.success({
    message: `${count} notification(s) marked as read`,
    count
  }, res);
});

/**
 * Delete a notification
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    throw new ValidationError('Valid notification ID is required');
  }

  const success = await NotificationService.delete(parseInt(id), userId);

  if (!success) {
    throw new NotFoundError('Notification not found');
  }

  ResponseHelper.success({
    message: 'Notification deleted successfully'
  }, res);
});

/**
 * Delete all read notifications
 */
const deleteAllRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await NotificationService.deleteAllRead(userId);

  ResponseHelper.success({
    message: `${count} read notification(s) deleted`,
    count
  }, res);
});

/**
 * Get a single notification by ID
 */
const getNotificationById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    throw new ValidationError('Valid notification ID is required');
  }

  const notification = await NotificationService.getById(parseInt(id), userId);

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  ResponseHelper.success({
    notification
  }, res);
});

export {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getNotificationById
};
