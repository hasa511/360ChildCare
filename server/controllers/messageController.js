import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { asyncHandler, ApiError } from '../utils/helpers.js';

// @route GET /api/messages/conversations
export const getConversations = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const convos = await Message.aggregate([
    { $match: { $or: [{ sender: me }, { recipient: me }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ['$sender', me] }, '$recipient', '$sender'] },
        lastMessage: { $first: '$body' },
        lastAt: { $first: '$createdAt' },
        lastSender: { $first: '$sender' },
        unread: {
          $sum: { $cond: [{ $and: [{ $eq: ['$recipient', me] }, { $eq: [{ $ifNull: ['$readAt', null] }, null] }] }, 1, 0] },
        },
      },
    },
    { $sort: { lastAt: -1 } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        user: { _id: '$user._id', name: '$user.name', role: '$user.role', position: '$user.position' },
        lastMessage: 1,
        lastAt: 1,
        lastSender: 1,
        unread: 1,
      },
    },
  ]);
  res.json({ success: true, data: convos });
});

// @route GET /api/messages/unread-count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({ recipient: req.user._id, readAt: null });
  res.json({ success: true, count });
});

// @route GET /api/messages/:userId   - thread with one user (marks incoming as read)
export const getThread = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, 'Invalid user id');
  const other = await User.findById(userId).select('name role position email phone');
  if (!other) throw new ApiError(404, 'User not found');

  const me = req.user._id;
  const messages = await Message.find({
    $or: [
      { sender: me, recipient: userId },
      { sender: userId, recipient: me },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(500);

  await Message.updateMany({ sender: userId, recipient: me, readAt: null }, { readAt: new Date() });
  res.json({ success: true, user: other, data: messages });
});

// @route POST /api/messages   { recipient, body }
export const sendMessage = asyncHandler(async (req, res) => {
  const { recipient, body } = req.body;
  if (!recipient || !body?.trim()) throw new ApiError(400, 'Recipient and message are required');
  if (String(recipient) === String(req.user._id)) throw new ApiError(400, 'You cannot message yourself');

  const to = await User.findById(recipient);
  if (!to || !to.isActive) throw new ApiError(404, 'Recipient not found');
  if (req.user.role === 'parent' && to.role === 'parent') {
    throw new ApiError(403, 'Parents can only message daycare staff');
  }

  const message = await Message.create({ sender: req.user._id, recipient, body });
  res.status(201).json({ success: true, data: message });
});