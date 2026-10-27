import User from '../models/User.js';
import Child from '../models/Child.js';
import Classroom from '../models/Classroom.js';
import { asyncHandler, ApiError, escapeRegex, pick, sameId } from '../utils/helpers.js';

const USER_FIELDS = ['name', 'email', 'phone', 'address', 'role', 'position', 'isActive'];

// @route GET /api/users?role=&search=   (admin)
export const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const users = await User.find(filter).sort({ role: 1, name: 1 });
  res.json({ success: true, count: users.length, data: users });
});

// @route GET /api/users/contacts   (any role - people this user can message)
export const getContacts = asyncHandler(async (req, res) => {
  const filter = { _id: { $ne: req.user._id }, isActive: true };
  if (req.user.role === 'parent') filter.role = { $in: ['admin', 'staff'] };
  const users = await User.find(filter).select('name role position email').sort({ role: 1, name: 1 });
  res.json({ success: true, data: users });
});

// @route GET /api/users/:id   (admin)
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const children = user.role === 'parent' ? await Child.find({ parents: user._id }).select('firstName lastName') : [];
  res.json({ success: true, data: user, children });
});

// @route POST /api/users   (admin)
export const createUser = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new ApiError(400, 'Password is required');
  const user = await User.create({ ...pick(req.body, USER_FIELDS), password });
  res.status(201).json({ success: true, data: user });
});

// @route PUT /api/users/:id   (admin)
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const updates = pick(req.body, USER_FIELDS);
  if (sameId(user._id, req.user._id) && (updates.role && updates.role !== 'admin' || updates.isActive === false)) {
    throw new ApiError(400, 'You cannot change your own role or deactivate yourself');
  }
  Object.assign(user, updates);
  if (req.body.password) user.password = req.body.password;
  await user.save();
  res.json({ success: true, data: user });
});

// @route DELETE /api/users/:id   (admin)
export const deleteUser = asyncHandler(async (req, res) => {
  if (sameId(req.params.id, req.user._id)) throw new ApiError(400, 'You cannot delete your own account');
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  // Unlink from children and classrooms
  await Child.updateMany({ parents: user._id }, { $pull: { parents: user._id } });
  await Classroom.updateMany({ staff: user._id }, { $pull: { staff: user._id } });

  res.json({ success: true, message: 'User deleted' });
});