import User from '../models/User.js';
import { asyncHandler, ApiError, generateToken, pick } from '../utils/helpers.js';

const authResponse = (res, status, user) =>
  res.status(status).json({ success: true, token: generateToken(user._id), user });

// @route POST /api/auth/register  (public - parent self-registration)
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password, phone, address, role: 'parent' });
  authResponse(res, 201, user);
});

// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated. Please contact the daycare.');

  authResponse(res, 200, user);
});

// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route PUT /api/auth/me
export const updateMe = asyncHandler(async (req, res) => {
  Object.assign(req.user, pick(req.body, ['name', 'phone', 'address']));
  await req.user.save();
  res.json({ success: true, user: req.user });
});

// @route PUT /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Current and new password are required');
  if (newPassword.length < 6) throw new ApiError(400, 'New password must be at least 6 characters');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new ApiError(401, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});