import Attendance from '../models/Attendance.js';
import Child from '../models/Child.js';
import { asyncHandler, ApiError, toDateStr, isValidDateStr } from '../utils/helpers.js';
import { buildChildFilter, ensureChildAccess } from '../utils/access.js';

const getActiveChild = async (childId) => {
  if (!childId) throw new ApiError(400, 'childId is required');
  const child = await Child.findById(childId);
  if (!child) throw new ApiError(404, 'Child not found');
  if (child.status !== 'active') throw new ApiError(400, 'Child is not currently enrolled');
  return child;
};

// @route GET /api/attendance/daily?date=&classroom=   (admin, staff)
// Returns a roster of all active children with their attendance record for the day.
export const getDailyRoster = asyncHandler(async (req, res) => {
  const date = isValidDateStr(req.query.date) ? req.query.date : toDateStr();
  const childFilter = { status: 'active' };
  if (req.query.classroom) childFilter.classroom = req.query.classroom;

  const children = await Child.find(childFilter)
    .select('firstName lastName classroom allergies authorizedPickups dateOfBirth')
    .populate('classroom', 'name')
    .sort({ firstName: 1 });

  const records = await Attendance.find({ date, child: { $in: children.map((c) => c._id) } })
    .populate('checkedInBy', 'name')
    .populate('checkedOutBy', 'name');
  const byChild = Object.fromEntries(records.map((r) => [String(r.child), r]));

  const roster = children.map((child) => ({ child, record: byChild[String(child._id)] || null }));
  const summary = {
    total: children.length,
    present: records.filter((r) => r.status === 'present').length,
    checkedOut: records.filter((r) => r.checkOutTime).length,
    absent: records.filter((r) => r.status === 'absent').length,
  };
  summary.notMarked = summary.total - summary.present - summary.absent;

  res.json({ success: true, date, summary, data: roster });
});

// @route GET /api/attendance?child=&from=&to=
export const getAttendance = asyncHandler(async (req, res) => {
  const filter = await buildChildFilter(req.user, req.query.child);
  const { from, to } = req.query;
  if (from || to) {
    filter.date = {};
    if (isValidDateStr(from)) filter.date.$gte = from;
    if (isValidDateStr(to)) filter.date.$lte = to;
  }
  const records = await Attendance.find(filter)
    .populate('child', 'firstName lastName')
    .populate('checkedInBy', 'name')
    .populate('checkedOutBy', 'name')
    .sort({ date: -1 })
    .limit(Number(req.query.limit) || 200);
  res.json({ success: true, count: records.length, data: records });
});

// @route POST /api/attendance/check-in   (admin, staff)
export const checkIn = asyncHandler(async (req, res) => {
  const { childId, droppedOffBy, notes } = req.body;
  const child = await getActiveChild(childId);
  const date = toDateStr();

  let record = await Attendance.findOne({ child: child._id, date });
  if (record?.checkInTime) throw new ApiError(400, `${child.firstName} is already checked in today`);

  if (!record) record = new Attendance({ child: child._id, date });
  Object.assign(record, {
    status: 'present',
    checkInTime: new Date(),
    checkedInBy: req.user._id,
    droppedOffBy,
    notes,
    absenceReason: undefined,
  });
  await record.save();
  res.status(201).json({ success: true, message: `${child.firstName} checked in`, data: record });
});

// @route POST /api/attendance/check-out   (admin, staff)
export const checkOut = asyncHandler(async (req, res) => {
  const { childId, pickedUpBy, notes } = req.body;
  const child = await getActiveChild(childId);
  if (!pickedUpBy) throw new ApiError(400, 'Please record who picked the child up');

  const record = await Attendance.findOne({ child: child._id, date: toDateStr() });
  if (!record?.checkInTime) throw new ApiError(400, `${child.firstName} has not been checked in today`);
  if (record.checkOutTime) throw new ApiError(400, `${child.firstName} is already checked out`);

  const authorized = child.authorizedPickups.some(
    (p) => p.name.trim().toLowerCase() === String(pickedUpBy).trim().toLowerCase()
  );

  Object.assign(record, { checkOutTime: new Date(), checkedOutBy: req.user._id, pickedUpBy });
  if (notes) record.notes = [record.notes, notes].filter(Boolean).join(' | ');
  await record.save();

  res.json({
    success: true,
    message: `${child.firstName} checked out`,
    warning: authorized ? undefined : `${pickedUpBy} is not on the authorized pickup list`,
    data: record,
  });
});

// @route POST /api/attendance/absent   (admin, staff, parent for own child)
export const markAbsent = asyncHandler(async (req, res) => {
  const { childId, reason } = req.body;
  const date = isValidDateStr(req.body.date) ? req.body.date : toDateStr();
  const child = await getActiveChild(childId);
  ensureChildAccess(req.user, child);

  if (req.user.role === 'parent' && date < toDateStr()) {
    throw new ApiError(400, 'Parents can only report absences for today or future dates');
  }

  let record = await Attendance.findOne({ child: child._id, date });
  if (record?.checkInTime) throw new ApiError(400, 'Child is already checked in for this date');
  if (!record) record = new Attendance({ child: child._id, date });

  Object.assign(record, { status: 'absent', absenceReason: reason, reportedBy: req.user._id });
  await record.save();
  res.status(201).json({ success: true, message: `${child.firstName} marked absent for ${date}`, data: record });
});

// @route DELETE /api/attendance/:id   (admin, staff) - undo a mistaken entry
export const deleteAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndDelete(req.params.id);
  if (!record) throw new ApiError(404, 'Attendance record not found');
  res.json({ success: true, message: 'Attendance record removed' });
});