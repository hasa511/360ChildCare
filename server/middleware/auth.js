import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler, ApiError } from '../utils/helpers.js';

/** Requires a valid Bearer token and attaches the user to req.user. */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Not authorized, no token');

  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Not authorized, token invalid or expired');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found or deactivated');

  req.user = user;
  next();
});

/** Restricts a route to the given roles. */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Access denied for role '${req.user.role}'`));
    }
    next();
  };