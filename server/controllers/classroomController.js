import Classroom from '../models/Classroom.js';
import Child from '../models/Child.js';
import User from '../models/User.js';
import { asyncHandler, ApiError, pick } from '../utils/helpers.js';

const FIELDS = ['name', 'ageGroup', 'capacity', 'monthlyFee', 'roomNumber', 'staff', 'description'];

const validateStaff = async (staff) => {
  if (!Array.isArray(staff) || !staff.length) return;
  const count = await User.countDocuments({ _id: { $in: staff }, role: { $in: ['staff', 'admin'] } });
  if (count !== staff.length) throw new ApiError(400, 'Assigned members must be staff accounts');
};

// @route GET /api/classrooms
export const getClassrooms = asyncHandler(async (req, res) => {
  const classrooms = await Classroom.find().populate('staff', 'name position email phone').sort({ name: 1 }).lean();
  const counts = await Child.aggregate([
    { $match: { status: 'active', classroom: { $ne: null } } },
    { $group: { _id: '$classroom', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  const data = classrooms.map((c) => ({ ...c, enrolled: countMap[String(c._id)] || 0 }));
  res.json({ success: true, count: data.length, data });
});

// @route GET /api/classrooms/:id
export const getClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.id).populate('staff', 'name position email phone');
  if (!classroom) throw new ApiError(404, 'Classroom not found');
  const children = await Child.find({ classroom: classroom._id, status: 'active' }).select(
    'firstName lastName dateOfBirth gender allergies'
  );
  res.json({ success: true, data: classroom, children });
});

// @route POST /api/classrooms   (admin)
export const createClassroom = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  await validateStaff(data.staff);
  const classroom = await Classroom.create(data);
  res.status(201).json({ success: true, data: classroom });
});

// @route PUT /api/classrooms/:id   (admin)
export const updateClassroom = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  await validateStaff(data.staff);
  const classroom = await Classroom.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!classroom) throw new ApiError(404, 'Classroom not found');
  res.json({ success: true, data: classroom });
});

// @route DELETE /api/classrooms/:id   (admin)
export const deleteClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findByIdAndDelete(req.params.id);
  if (!classroom) throw new ApiError(404, 'Classroom not found');
  await Child.updateMany({ classroom: classroom._id }, { $unset: { classroom: 1 } });
  res.json({ success: true, message: 'Classroom deleted; children have been unassigned' });
});