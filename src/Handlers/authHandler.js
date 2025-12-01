import { getPrisma } from '../db/prisma.js';
import { 
  hashPassword, 
  authenticateWithPassword,
  generateToken,
  generateRefreshToken
} from '../Middlewares/auth.js';
import ResponseHelper from '../utils/response.js';
import { 
  ValidationError, 
  ConflictError 
} from '../utils/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import NotificationService from '../services/notificationService.js';

const signup = asyncHandler(async (req, res) => {
  try {
    const prisma = getPrisma();
    const { 
      username, 
      email, 
      password, 
      role,
      firstName, 
      lastName, 
      phone,
      dateOfBirth,
      gender,
      address
    } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      throw new ValidationError('Email, password, and role are required');
    }

    // Validate role
    const validRoles = ['PATIENT', 'DOCTOR', 'ADMIN'];
    if (!validRoles.includes(role.toUpperCase())) {
      throw new ValidationError('Role must be PATIENT, DOCTOR, or ADMIN');
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ 
      where: { email } 
    });
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await prisma.user.findUnique({ 
        where: { username } 
      });
      if (existingUsername) {
        throw new ConflictError('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        phone,
        role: role.toUpperCase(),
        isActive: true
      }
    });

    // Create role-specific profile
    if (role.toUpperCase() === 'PATIENT') {
      await prisma.patient.create({
        data: {
          userId: user.id,
          firstName: firstName || '',
          lastName: lastName || '',
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender?.toUpperCase(),
          address
        }
      });
    } else if (role.toUpperCase() === 'DOCTOR') {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          firstName: firstName || '',
          lastName: lastName || ''
        }
      });
    } else if (role.toUpperCase() === 'ADMIN') {
      await prisma.admin.create({
        data: {
          userId: user.id,
          firstName: firstName || '',
          lastName: lastName || '',
          adminLevel: 'REGULAR'
        }
      });
    }

    // Create welcome notification for the new user
    const welcomeMessages = {
      'PATIENT': 'Welcome to Alex Med Services! You can now search for doctors and book appointments.',
      'DOCTOR': 'Welcome Dr.! Please complete your profile and set up your schedules to start receiving appointments.',
      'ADMIN': 'Welcome Admin! You have full access to manage the platform.'
    };

    await NotificationService.create({
      userId: user.id,
      role: user.role,
      type: 'WELCOME',
      title: 'Welcome!',
      message: welcomeMessages[user.role],
      priority: 'medium',
      category: 'SYSTEM'
    });

    // Notify all admins about new user registration
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (admins.length > 0) {
      const userName = role === 'PATIENT' ? `${firstName} ${lastName}` 
                      : role === 'DOCTOR' ? `Dr. ${firstName} ${lastName}`
                      : `Admin ${firstName} ${lastName}`;

      await NotificationService.createMany(
        admins.map(admin => ({
          userId: admin.id,
          role: 'ADMIN',
          type: 'NEW_USER_REGISTERED',
          title: 'New User Registration',
          message: `${userName} (${email}) has registered as a ${role}`,
          data: JSON.stringify({ newUserId: user.id, newUserRole: role }),
          priority: role === 'DOCTOR' ? 'medium' : 'low',
          category: 'SYSTEM'
        }))
      );
    }

    ResponseHelper.created({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    }, res);

  } catch (error) {
    throw error;
  }
});

/**
 * Handle user signin
 */
const signin = asyncHandler(async (req, res) => {
  try {
    const prisma = getPrisma();
    const { identifier, password } = req.body;

    
    // Validate input
    if (!identifier || !password) {
      throw new ValidationError('Username/email and password are required');
    }

    // Authenticate user
    const result = await authenticateWithPassword(identifier, password);

    if (!result.success) {
      throw new ValidationError(result.message);
    }

    // Generate role-specific tokens
    const accessToken = generateToken(result.user.id, result.user.role);
    const refreshToken = generateRefreshToken(result.user.id, result.user.role);

    ResponseHelper.success({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: result.user
    }, res);

  } catch (error) {
    throw error;
  }
});

/**
 * Get current user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  try {
    ResponseHelper.success({ 
      user: req.user 
    }, res);
  } catch (error) {
    throw error;
  }
});

/**
 * Update user profile (role-aware)
 */
const updateProfile = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const userId = req.user.id;
  const userRole = req.user.role;
  
  // Extract common user fields
  const { username, phone } = req.body;
  
  // Update User table if common fields provided
  const userUpdateData = {};
  if (username !== undefined) userUpdateData.username = username;
  if (phone !== undefined) userUpdateData.phone = phone;
  
  // Check if username is taken by another user
  if (username) {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError('Username already taken');
    }
  }
  
  // Update user table
  if (Object.keys(userUpdateData).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: userUpdateData
    });
  }
  
  // Update role-specific profile
  let updatedProfile;
  
  if (userRole === 'PATIENT') {
    const { firstName, lastName, dateOfBirth, gender, address } = req.body;
    const patientUpdateData = {};
    
    if (firstName !== undefined) patientUpdateData.firstName = firstName;
    if (lastName !== undefined) patientUpdateData.lastName = lastName;
    if (dateOfBirth !== undefined) patientUpdateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) patientUpdateData.gender = gender?.toUpperCase();
    if (address !== undefined) patientUpdateData.address = address;
    if (phone !== undefined) patientUpdateData.phone = phone;
    
    if (Object.keys(patientUpdateData).length > 0) {
      updatedProfile = await prisma.patient.update({
        where: { userId },
        data: patientUpdateData
      });
    }
  } 
  else if (userRole === 'DOCTOR') {
    const { firstName, lastName, profileImage, yearsOfExperience, qualifications, bio } = req.body;
    const doctorUpdateData = {};
    
    if (firstName !== undefined) doctorUpdateData.firstName = firstName;
    if (lastName !== undefined) doctorUpdateData.lastName = lastName;
    if (profileImage !== undefined) doctorUpdateData.profileImage = profileImage;
    if (yearsOfExperience !== undefined) doctorUpdateData.yearsOfExperience = yearsOfExperience;
    if (qualifications !== undefined) doctorUpdateData.qualifications = qualifications;
    if (bio !== undefined) doctorUpdateData.bio = bio;
    
    if (Object.keys(doctorUpdateData).length > 0) {
      updatedProfile = await prisma.doctor.update({
        where: { userId },
        data: doctorUpdateData
      });
    }
  } 
  else if (userRole === 'ADMIN') {
    const { firstName, lastName, adminLevel } = req.body;
    const adminUpdateData = {};
    
    if (firstName !== undefined) adminUpdateData.firstName = firstName;
    if (lastName !== undefined) adminUpdateData.lastName = lastName;
    if (adminLevel !== undefined) adminUpdateData.adminLevel = adminLevel;
    
    if (Object.keys(adminUpdateData).length > 0) {
      updatedProfile = await prisma.admin.update({
        where: { userId },
        data: adminUpdateData
      });
    }
  }
  
  // Fetch updated user with profile
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patient: userRole === 'PATIENT',
      doctor: userRole === 'DOCTOR' ? {
        include: {
          specializations: {
            include: {
              specialization: true
            }
          }
        }
      } : false,
      admin: userRole === 'ADMIN'
    }
  });
  
  ResponseHelper.success({
    message: 'Profile updated successfully',
    user: updatedUser
  }, res);
});

/**
 * Handle user logout
 */
const logout = asyncHandler(async (req, res) => {
  try {
    // In a more sophisticated system, invalidate the refresh token here
    ResponseHelper.success({ 
      message: 'Logged out successfully' 
    }, res);
  } catch (error) {
    throw error;
  }
});

/**
 * Change password for authenticated user
 */
const changePassword = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }

  if (newPassword.length < 6) {
    throw new ValidationError('New password must be at least 6 characters long');
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  // Verify current password
  const { comparePassword, hashPassword } = await import('../Middlewares/auth.js');
  const isValid = await comparePassword(currentPassword, user.passwordHash);

  if (!isValid) {
    throw new ValidationError('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash }
  });

  ResponseHelper.success({
    message: 'Password changed successfully'
  }, res);
});

/**
 * Refresh access token using refresh token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new ValidationError('Refresh token is required');
  }

  try {
    const { REFRESH_TOKEN_SECRET } = await import('../Middlewares/auth.js');
    const jwt = (await import('jsonwebtoken')).default;
    
    // Verify refresh token
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);

    if (decoded.type !== 'refresh') {
      throw new ValidationError('Invalid token type');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    if (!user.isActive) {
      throw new ValidationError('Account is deactivated');
    }

    // Verify role hasn't changed
    if (decoded.role !== user.role) {
      throw new ValidationError('User role has changed. Please login again.');
    }

    // Generate new tokens
    const { generateToken, generateRefreshToken } = await import('../Middlewares/auth.js');
    const newAccessToken = generateToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.role);

    ResponseHelper.success({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }, res);

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ValidationError('Invalid refresh token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ValidationError('Refresh token expired. Please login again.');
    }
    throw error;
  }
});

export { signup, signin, getProfile, updateProfile, logout, changePassword, refreshToken };

