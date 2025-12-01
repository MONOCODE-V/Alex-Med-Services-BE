import { getPrisma } from '../db/prisma.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

class User {
  /**
   * Find user by ID
   * @param {Number} id - User ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const prisma = getPrisma();
    return await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        doctor: {
          include: {
            specializations: {
              include: {
                specialization: true
              }
            }
          }
        },
        admin: true
      }
    });
  }

  /**
   * Find user by email
   * @param {String} email - User email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const prisma = getPrisma();
    return await prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        doctor: {
          include: {
            specializations: {
              include: {
                specialization: true
              }
            }
          }
        },
        admin: true
      }
    });
  }

  /**
   * Find user by username
   * @param {String} username - Username
   * @returns {Promise<Object|null>}
   */
  static async findByUsername(username) {
    const prisma = getPrisma();
    return await prisma.user.findUnique({
      where: { username },
      include: {
        patient: true,
        doctor: {
          include: {
            specializations: {
              include: {
                specialization: true
              }
            }
          }
        },
        admin: true
      }
    });
  }

  /**
   * Find user by username or email
   * @param {String} identifier - Username or email
   * @returns {Promise<Object|null>}
   */
  static async findByUsernameOrEmail(identifier) {
    const prisma = getPrisma();
    return await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      },
      include: {
        patient: true,
        doctor: {
          include: {
            specializations: {
              include: {
                specialization: true
              }
            }
          }
        },
        admin: true
      }
    });
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  static async create(userData) {
    const prisma = getPrisma();
    // Hash password if provided
    if (userData.password) {
      userData.passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
      delete userData.password;
    }

    return await prisma.user.create({
      data: userData,
      include: {
        patient: true,
        doctor: true,
        admin: true
      }
    });
  }

  /**
   * Update user
   * @param {Number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>}
   */
  static async update(id, updateData) {
    const prisma = getPrisma();
    // Hash password if being updated
    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, SALT_ROUNDS);
      delete updateData.password;
    }

    return await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
        admin: true
      }
    });
  }

  /**
   * Delete user
   * @param {Number} id - User ID
   * @returns {Promise<Object>}
   */
  static async delete(id) {
    const prisma = getPrisma();
    return await prisma.user.delete({
      where: { id: parseInt(id) }
    });
  }

  /**
   * Find all users with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>}
   */
  static async findAll(filters = {}) {
    const prisma = getPrisma();
    return await prisma.user.findMany({
      where: filters,
      include: {
        patient: true,
        doctor: true,
        admin: true
      }
    });
  }

  /**
   * Verify user password
   * @param {String} plainPassword - Plain text password
   * @param {String} hashedPassword - Hashed password from database
   * @returns {Promise<Boolean>}
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update last login timestamp
   * @param {Number} id - User ID
   * @returns {Promise<Object>}
   */
  static async updateLastLogin(id) {
    const prisma = getPrisma();
    return await prisma.user.update({
      where: { id: parseInt(id) },
      data: { lastLogin: new Date() }
    });
  }

  /**
   * Deactivate user account
   * @param {Number} id - User ID
   * @returns {Promise<Object>}
   */
  static async deactivate(id) {
    const prisma = getPrisma();
    return await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
  }

  /**
   * Activate user account
   * @param {Number} id - User ID
   * @returns {Promise<Object>}
   */
  static async activate(id) {
    const prisma = getPrisma();
    return await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: true }
    });
  }

  /**
   * Select method to exclude password from query results
   * @param {String} fields - Fields to exclude (default: '-password')
   * @returns {Object} Select object for Prisma
   */
  static select(fields = '-password') {
    const exclude = fields.startsWith('-');
    const fieldList = fields.replace('-', '').split(' ');
    
    if (exclude) {
      return {
        id: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        isActive: true,
        passwordHash: false
      };
    }
    
    const selectObj = {};
    fieldList.forEach(field => {
      selectObj[field] = true;
    });
    return selectObj;
  }
}

export { User };

