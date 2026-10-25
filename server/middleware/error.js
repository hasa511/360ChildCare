import { ApiError } from '../utils/helpers.js';

export const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  }
  if (err.code === 11000) {
    status = 409;
    message = `A record with this ${Object.keys(err.keyValue || {}).join(', ')} already exists`;
  }
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('. ');
  }
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  }

  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(err);

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
};