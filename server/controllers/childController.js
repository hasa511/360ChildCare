import Child from '../models/Child.js';
import Attendance from '../models/Attendance.js';
import ActivityLog from '../models/ActivityLog.js';
import Incident from '../models/Incident.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { asyncHandler, ApiError, escapeRegex, pick } from '../utils/helpers.js';
import { ensureChildAccess } from '../utils/access.js';

const CHILD_FIELDS = [
  'firstName', 'lastName', 'dateOfBirth', 'gender', 'classroom', 'parents', 'allergies',
  'medicalNotes', 'bloodGroup', 'emergencyContacts', 'authorizedPickups', 'enrollmentDate', 'status', 'notes',
];

const populateChild = (q) =>
  q.populate('classroom', 'name ageGroup roomNumber').populate('parents', 'name email phone');

const cleanPayload = async (body) => {
  const data = pick(body, CHILD_FIELDS);
  if (data.classroom === '') data.classroom = null;
  if (typeof data.allergies === 'string') {
    data.allergies = data.allergies.split(',').map((a) => a.trim()).filter(Boolean);
  }
  if (Array.isArray(data.parents) && data.parents.length) {
    const count = await User.countDocuments({ _id: { $in: data.parents }, role: 'parent' });
    if (count !== data.parents.length) throw new ApiError(400, 'All linked parents must be parent accounts');
  }
  return data;
};

// @route GET /api/children?classroom=&status=&search=
export const getChildren = asyncHandler(async (req, res) => {
  const { classroom, status, search } = req.query;
  const filter = {};
  if (req.user.role === 'parent') filter.parents = req.user._id;
  if (classroom) filter.classroom = classroom;
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }];
  }
  const children = await populateChild(Child.find(filter)).sort({ firstName: 1 });
  res.json({ success: true, count: children.length, data: children });
});

// @route GET /api/children/:id
export const getChild = asyncHandler(async (req, res) => {
  const child = await populateChild(Child.findById(req.params.id));
  ensureChildAccess(req.user, child);
  res.json({ success: true, data: child });
});

// @route POST /api/children   (admin)
export const createChild = asyncHandler(async (req, res) => {
  const child = await Child.create(await cleanPayload(req.body));
  res.status(201).json({ success: true, data: await populateChild(Child.findById(child._id)) });
});

// @route PUT /api/children/:id   (admin)
export const updateChild = asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id);
  if (!child) throw new ApiError(404, 'Child not found');
  Object.assign(child, await cleanPayload(req.body));
  await child.save();
  res.json({ success: true, data: await populateChild(Child.findById(child._id)) });
});

// @route DELETE /api/children/:id   (admin) - removes child and all related records
export const deleteChild = asyncHandler(async (req, res) => {
  const child = await Child.findByIdAndDelete(req.params.id);
  if (!child) throw new ApiError(404, 'Child not found');
  await Promise.all([
    Attendance.deleteMany({ child: child._id }),
    ActivityLog.deleteMany({ child: child._id }),
    Incident.deleteMany({ child: child._id }),
    Invoice.deleteMany({ child: child._id }),
  ]);
  res.json({ success: true, message: 'Child and related records deleted' });
});