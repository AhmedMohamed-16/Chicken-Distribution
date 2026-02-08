module.exports = (err, req, res, next) => {
  // Defaults
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  /**
   * =========================
   * Development Environment
   * =========================
   */
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ ERROR (DEV):', err);

    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
      path: req.originalUrl
    });
  }

  /**
   * =========================
   * Production Environment
   * =========================
   */

  // ---------- Multer Errors ----------
  if (err.code === 'LIMIT_FILE_SIZE') {
    err.statusCode = 400;
    err.message = 'File size too large. Maximum size is 500MB';
    err.isOperational = true;
  }

  if (err.message === 'Only ZIP files are allowed') {
    err.statusCode = 400;
    err.isOperational = true;
  }

  // ---------- Sequelize Errors ----------
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Duplicate entry',
      field: err.errors[0]?.path
    });
  }

  // ---------- Operational Errors ----------
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  }

  // ---------- Programming / Unknown Errors ----------
  console.error('🔥 UNEXPECTED ERROR (PROD):', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'حدث خطأ غير متوقع، يرجى الاتصال بالمختص'
  });
};
