const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong.',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // Programming or other unknown error: don't leak error details
    }
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  // rendered Website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong.',
      msg: err.message,
    });

    // Programming or other unknown error: don't leak error details
  }
  // 1) Log error
  console.error('ERROR 💥', err);

  // 2) Send generic message
  return res.status(500).json({
    status: 'error',
    message: 'Please try again. ',
  });
};

const handleJsonWebTokenErrorError = () =>
  new AppError('Invalid Token, please log-in again', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      error = handleJsonWebTokenErrorError(error);
    }
    sendErrorProd(error, req, res);
  }
};
