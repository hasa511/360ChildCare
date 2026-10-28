import ActivityLog from '../models/ActivityLog.js';
import Child from '../models/Child.js';
import { asyncHandler, ApiError, pick, toDateStr, isValidDateStr } from '../utils/helpers.js';
import { buildChildFilter } from '../utils/access.js';

const FIELDS = ['date', 'time', 'type', 'title', 'details', 'mood', 'mealAmount', 'durationMins'];

const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// @route GET /api/activities?child=&date=&type=&limit=
export const getActivities = asyncHandler(async (req, res) => {
  const filter = await buildChildFilter(req.user, req.query.child);
  if (isValidDateStr(req.query.date)) filter.date = req.query.date;
  if (req.query.type) filter.type = req.query.type;

  const logs = await ActivityLog.find(filter)
    .populate('child', 'firstName lastName')
    .populate('recordedBy', 'name')
    .sort({ date: -1, time: -1, createdAt: -1 })
    .limit(Math.min(Number(req.query.limit) || 100, 500));
  res.json({ success: true, count: logs.length, data: logs });
});

// @route POST /api/activities   (admin, staff)
// Accepts `child` (single) or `children` (array) to log a group activity at once.
export const createActivity = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.children) && req.body.children.length ? req.body.children : [req.body.child];
  if (!ids[0]) throw new ApiError(400, 'Select at least one child');

  const found = await Child.countDocuments({ _id: { $in: ids }, status: 'active' });
  if (found !== ids.length) throw new ApiError(400, 'One or more selected children are invalid or inactive');

  const base = pick(req.body, FIELDS);
  base.date = isValidDateStr(base.date) ? base.date : toDateStr();
  base.time = base.time || nowTime();
  base.recordedBy = req.user._id;

  const docs = ids.map((child) => new ActivityLog({ ...base, child }));
  await Promise.all(docs.map((d) => d.validate()));
  const created = await ActivityLog.insertMany(docs);
  res.status(201).json({ success: true, count: created.length, data: created });
});

// @route PUT /api/activities/:id   (admin, staff)
export const updateActivity = asyncHandler(async (req, res) => {
  const log = await ActivityLog.findByIdAndUpdate(req.params.id, pick(req.body, FIELDS), {
    new: true,
    runValidators: true,
  });
  if (!log) throw new ApiError(404, 'Activity log not found');
  res.json({ success: true, data: log });
});

// @route DELETE /api/activities/:id   (admin, staff)
export const deleteActivity = asyncHandler(async (req, res) => {
  const log = await ActivityLog.findByIdAndDelete(req.params.id);
  if (!log) throw new ApiError(404, 'Activity log not found');
  res.json({ success: true, message: 'Activity log deleted' });
});