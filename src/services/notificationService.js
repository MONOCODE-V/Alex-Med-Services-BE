import { getPrisma } from '../db/prisma.js';

/**
 * Notification Service
 * Central service for managing persistent notifications
 */

class NotificationService {
  /**
   * Create a new notification
   * @param {Object} data - Notification data
   * @param {number} data.userId - User ID
   * @param {string} data.role - User role (PATIENT, DOCTOR, ADMIN)
   * @param {string} data.type - Notification type
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {Object} [data.data] - Additional data (will be JSON stringified)
   * @param {string} [data.priority='medium'] - Priority: high, medium, low
   * @param {string} [data.category] - Category: APPOINTMENTS, SCHEDULE, SYSTEM, etc.
   */
  static async create({ userId, role, type, title, message, data, priority = 'medium', category }) {
    const prisma = getPrisma();
    
    const notification = await prisma.notification.create({
      data: {
        userId,
        role,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        priority,
        category,
        isRead: false
      }
    });

    return notification;
  }

  /**
   * Create multiple notifications at once
   * @param {Array<Object>} notifications - Array of notification data
   */
  static async createMany(notifications) {
    const prisma = getPrisma();
    
    const notificationsToCreate = notifications.map(notif => ({
      userId: notif.userId,
      role: notif.role,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      data: notif.data ? JSON.stringify(notif.data) : null,
      priority: notif.priority || 'medium',
      category: notif.category,
      isRead: false
    }));

    const result = await prisma.notification.createMany({
      data: notificationsToCreate
    });

    return result;
  }

  /**
   * Get notifications for a user with pagination
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @param {boolean} [options.unreadOnly=false] - Show only unread notifications
   * @param {number} [options.limit=20] - Number of notifications per page
   * @param {number} [options.offset=0] - Offset for pagination
   * @param {string} [options.category] - Filter by category
   * @param {string} [options.priority] - Filter by priority
   */
  static async getForUser(userId, { unreadOnly = false, limit = 20, offset = 0, category, priority } = {}) {
    const prisma = getPrisma();

    const where = { userId };
    if (unreadOnly) where.isRead = false;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { isRead: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.notification.count({ where })
    ]);

    // Parse JSON data field
    const parsedNotifications = notifications.map(notif => ({
      ...notif,
      data: notif.data ? JSON.parse(notif.data) : null
    }));

    return {
      notifications: parsedNotifications,
      total,
      unread: await this.getUnreadCount(userId),
      hasMore: offset + limit < total
    };
  }

  /**
   * Mark notification as read
   * @param {number} id - Notification ID
   * @param {number} userId - User ID (for verification)
   */
  static async markAsRead(id, userId) {
    const prisma = getPrisma();

    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return notification.count > 0;
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   */
  static async markAllAsRead(userId) {
    const prisma = getPrisma();

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return result.count;
  }

  /**
   * Delete a notification
   * @param {number} id - Notification ID
   * @param {number} userId - User ID (for verification)
   */
  static async delete(id, userId) {
    const prisma = getPrisma();

    const result = await prisma.notification.deleteMany({
      where: {
        id,
        userId
      }
    });

    return result.count > 0;
  }

  /**
   * Delete all read notifications for a user
   * @param {number} userId - User ID
   */
  static async deleteAllRead(userId) {
    const prisma = getPrisma();

    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true
      }
    });

    return result.count;
  }

  /**
   * Get unread notification count
   * @param {number} userId - User ID
   */
  static async getUnreadCount(userId) {
    const prisma = getPrisma();

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return count;
  }

  /**
   * Get notification by ID (with user verification)
   * @param {number} id - Notification ID
   * @param {number} userId - User ID (for verification)
   */
  static async getById(id, userId) {
    const prisma = getPrisma();

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (notification && notification.data) {
      notification.data = JSON.parse(notification.data);
    }

    return notification;
  }

  /**
   * Clean old notifications (older than specified days)
   * @param {number} [days=30] - Delete notifications older than this many days
   */
  static async cleanOld(days = 30) {
    const prisma = getPrisma();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        isRead: true
      }
    });

    return result.count;
  }
}

export default NotificationService;
