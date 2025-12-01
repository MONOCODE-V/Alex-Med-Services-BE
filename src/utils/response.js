class ResponseHelper {
  static success(data, res, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data
    });
  }

  /**
   * Created response (201)
   * @param {Object} data - Created resource data
   * @param {Object} res - Express response object
   */
  static created(data, res) {
    return res.status(201).json({
      success: true,
      data
    });
  }

  /**
   * No content response (204)
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Fail response (client errors 4xx)
   * @param {Object} data - Error details
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code (default: 400)
   */
  static fail(data, res, statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      ...data
    });
  }

  /**
   * Error response (server errors 5xx)
   * @param {String} message - Error message
   * @param {Object} res - Express response object
   * @param {Number} statusCode - HTTP status code (default: 500)
   */
  static error(message, res, statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message: message || 'Internal server error'
    });
  }

  /**
   * Unauthorized response (401)
   * @param {String} message - Error message
   * @param {Object} res - Express response object
   */
  static unauthorized(message, res) {
    return res.status(401).json({
      success: false,
      message: message || 'Unauthorized access'
    });
  }

  /**
   * Forbidden response (403)
   * @param {String} message - Error message
   * @param {Object} res - Express response object
   */
  static forbidden(message, res) {
    return res.status(403).json({
      success: false,
      message: message || 'Access forbidden'
    });
  }

  /**
   * Not found response (404)
   * @param {String} message - Error message
   * @param {Object} res - Express response object
   */
  static notFound(message, res) {
    return res.status(404).json({
      success: false,
      message: message || 'Resource not found'
    });
  }

  /**
   * Validation error response (422)
   * @param {Object} errors - Validation errors
   * @param {Object} res - Express response object
   */
  static validationError(errors, res) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  /**
   * Custom response
   * @param {Number} statusCode - HTTP status code
   * @param {Object} data - Response data
   * @param {Object} res - Express response object
   */
  static custom(statusCode, data, res) {
    return res.status(statusCode).json(data);
  }

  /**
   * Paginated response
   * @param {Array} data - Response data array
   * @param {Number} page - Current page
   * @param {Number} limit - Items per page
   * @param {Number} total - Total count
   * @param {Object} res - Express response object
   */
  static paginated(data, page, limit, total, res) {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }
}

export default ResponseHelper;

