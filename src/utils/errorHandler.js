class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class ErrorHandler {
  static setupGlobalHandlers() {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Promise Rejection at:', promise);
      console.error('Reason:', reason);
    
      // Log to error monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to error monitoring service
        console.error('🔄 Continuing server operation...');
      } else {
        console.error('💥 Shutting down due to unhandled promise rejection');
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.error('💥 Shutting down gracefully...');
      process.exit(1);
    });

    // Handle warnings
    process.on('warning', (warning) => {
      console.warn('⚠️ Warning:', warning.name, warning.message);
      console.warn('Stack:', warning.stack);
    });
  }

  static expressErrorHandler() {
    return (err, req, res, next) => {
      const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      console.error(`🔥 Error [${errorId}] caught by Express middleware:`);
      console.error('URL:', req.method, req.originalUrl);
      console.error('User:', req.user ? req.user.id : 'anonymous');
      console.error('Body:', JSON.stringify(req.body, null, 2));
      console.error('Query:', JSON.stringify(req.query, null, 2));
      console.error('Headers:', JSON.stringify(req.headers, null, 2));
      console.error('Message:', err.message);
      console.error('Stack:', err.stack);
      
      let statusCode = err.statusCode || err.status || 500;
      let message = err.message || 'Internal Server Error';
      let errors = null;
      
      // Handle specific error types
      if (err.name === 'ValidationError') {
        statusCode = 400;
        if (err.errors) {
          errors = Object.values(err.errors).map(error => ({
            field: error.path,
            message: error.message,
            value: error.value
          }));
          message = 'Validation failed';
        } else {
          message = err.message;
        }
      } else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
      } else if (err.code === 11000) {
        // MongoDB duplicate key error
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const value = err.keyValue ? err.keyValue[field] : 'unknown';
        message = `Duplicate value '${value}' for field '${field}'`;
      } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
      } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired';
      } else if (err.name === 'MulterError') {
        statusCode = 400;
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            message = 'File too large';
            break;
          case 'LIMIT_FILE_COUNT':
            message = 'Too many files uploaded';
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            message = 'Unexpected file field';
            break;
          default:
            message = `File upload error: ${err.message}`;
        }
      } else if (err.name === 'PrismaClientKnownRequestError') {
        // Prisma errors
        statusCode = 400;
        if (err.code === 'P2002') {
          // Unique constraint violation
          statusCode = 409;
          const field = err.meta?.target?.[0] || 'field';
          message = `Duplicate value for field '${field}'`;
        } else if (err.code === 'P2025') {
          // Record not found
          statusCode = 404;
          message = 'Record not found';
        }
      } else if (err.name === 'PrismaClientValidationError') {
        statusCode = 400;
        message = 'Invalid data provided';
      } else if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Invalid JSON in request body';
      } else if (err.type === 'entity.too.large') {
        statusCode = 413;
        message = 'Request entity too large';
      }

      const response = {
        success: false,
        error: {
          message,
          statusCode,
          errorId
        }
      };

      // Add validation errors if present
      if (errors) {
        response.error.details = errors;
      }

      // Don't expose stack trace in production
      if (process.env.NODE_ENV !== 'production') {
        response.error.stack = err.stack;
      }

      res.status(statusCode).json(response);
    };
  }

  static notFoundHandler() {
    return (req, res, next) => {
      const error = new NotFoundError(`Route ${req.originalUrl} not found`);
      next(error);
    };
  }

  static serverErrorHandler(server, port) {
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

      switch (error.code) {
        case 'EACCES':
          console.error(`❌ ${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ ${bind} is already in use`);
          process.exit(1);
          break;
        default:
          console.error('❌ Server error:', error);
          throw error;
      }
    });

    server.on('listening', () => {
      const addr = server.address();
      const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
      console.log(`🚀 Server listening on ${bind}`);
    });
  }

  static createError(message, statusCode = 500) {
    return new AppError(message, statusCode);
  }

  static createValidationError(message) {
    return new ValidationError(message);
  }

  static createAuthenticationError(message) {
    return new AuthenticationError(message);
  }

  static createAuthorizationError(message) {
    return new AuthorizationError(message);
  }

  static createNotFoundError(message) {
    return new NotFoundError(message);
  }

  static createConflictError(message) {
    return new ConflictError(message);
  }
}

export {
  ErrorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
};

