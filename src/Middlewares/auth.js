import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/index.js';
import ResponseHelper from '../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key-change-in-production';
const SALT_ROUNDS = 10;

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) {
      return ResponseHelper.unauthorized('Access token is required', res);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return ResponseHelper.unauthorized('Invalid token - user not found', res);
    }

    if (!user.isActive) {
      return ResponseHelper.fail({ message: 'Account is deactivated' }, res, 401);
    }

    // Verify role in token matches current user role
    if (decoded.role && decoded.role !== user.role) {
      return ResponseHelper.unauthorized('Token role mismatch - please login again', res);
    }

    delete user.passwordHash;

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ResponseHelper.unauthorized('Invalid token', res);
    }
    if (error.name === 'TokenExpiredError') {
      return ResponseHelper.unauthorized('Token expired', res);
    }
    
    console.error('Auth middleware error:', error);
    ResponseHelper.error('Server error during authentication', res);
  }
};

const authenticateRole = (role) => async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      return ResponseHelper.unauthorized('Access token is required', res);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return ResponseHelper.unauthorized('Invalid token - user not found', res);
    }

    if (!user.isActive) {
      return ResponseHelper.fail({ message: 'Account is deactivated' }, res, 401);
    }

    // Verify role from token
    if (decoded.role && decoded.role !== role) {
      return ResponseHelper.forbidden('Insufficient permissions', res);
    }

    // Double-check with database role
    if (user.role !== role) {
      return ResponseHelper.forbidden(`${role.charAt(0) + role.slice(1).toLowerCase()} access required`, res);
    }

    delete user.passwordHash;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ResponseHelper.unauthorized('Invalid token', res);
    }
    if (error.name === 'TokenExpiredError') {
      return ResponseHelper.unauthorized('Token expired', res);
    }
    
    console.error(`${role} auth middleware error:`, error);
    ResponseHelper.error('Server error during authentication', res);
  }
};

const authenticatePatient = authenticateRole('PATIENT');
const authenticateDoctor = authenticateRole('DOCTOR');
const authenticateAdmin = authenticateRole('ADMIN');



const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        delete user.passwordHash;
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
};

const generateRefreshToken = (userId, role) => {
  return jwt.sign(
    { userId, role, type: 'refresh' },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const authenticateWithPassword = async (identifier, password) => {
  try {
    const user = await User.findByUsernameOrEmail(identifier);
    
    if (!user) {
      return { 
        success: false, 
        message: 'Invalid username/email or password' 
      };
    }

    if (!user.isActive) {
      return { 
        success: false, 
        message: 'Account is deactivated' 
      };
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return { 
        success: false, 
        message: 'Invalid username/email or password' 
      };
    }

    await User.updateLastLogin(user.id);

    const accessToken = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    delete user.passwordHash;

    return {
      success: true,
      user,
      accessToken,
      refreshToken
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      message: 'Authentication failed',
      error: error.message
    };
  }
};

// Warn if using default secrets in production
if (process.env.NODE_ENV === 'production') {
  if (JWT_SECRET === 'your-secret-key-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET in production! Set JWT_SECRET in environment variables.');
  }
  if (REFRESH_TOKEN_SECRET === 'your-refresh-secret-key-change-in-production') {
    console.warn('⚠️  WARNING: Using default REFRESH_TOKEN_SECRET in production! Set REFRESH_TOKEN_SECRET in environment variables.');
  }
}

export {
  authenticateToken,
  authenticatePatient,
  authenticateDoctor,
  authenticateAdmin,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  authenticateWithPassword,
  JWT_SECRET,
  REFRESH_TOKEN_SECRET
};
