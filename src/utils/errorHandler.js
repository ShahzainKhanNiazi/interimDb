// utils/errorHandler.js
class ApiError extends Error {
    constructor(statusCode, message, error = null) {
      super(message);
      this.statusCode = statusCode;
      this.error = error;
    }
  }
  
  const handleError = (res, error) => {
    const { statusCode, message, error: err } = error;
    res.status(statusCode || 500).json({
      status: 'error',
      statusCode: statusCode || 500,
      message: message || 'Internal Server Error',
      error: err || null,
    });
  };
  
  module.exports = { ApiError, handleError };
  