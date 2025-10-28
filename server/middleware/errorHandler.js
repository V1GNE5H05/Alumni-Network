const fs = require('fs');
const path = require('path');

// Global error handler middleware
function errorHandler(err, req, res, next) {
  console.error('Error occurred:', err);

  // Log error to file
  const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n\n`;
  const logPath = path.join(__dirname, '../logs/error.log');
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  fs.appendFileSync(logPath, logMessage);

  // Handle specific error types
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// 404 handler
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
