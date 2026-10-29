import Child from '../models/Child.js';
import User from '../models/User.js';
import Classroom from '../models/Classroom.js';
import Attendance from '../models/Attendance.js';
import ActivityLog from '../models/ActivityLog.js';
import Incident from '../models/Incident.js';
import Invoice from '../models/Invoice.js';
import Announcement from '../models/Announcement.js';
import Message from '../models/Message.js';
import { asyncHandler, toDateStr, lastNDates } from '../utils/helpers.js';

const weekAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
};

const attendanceTrend = async (childFilter = {}) => {
  const days = lastNDates(7);
  const match = { date: { $in: days }, status: 'present' };
  if (childFilter.child) match.child = childFilter.child;
  const agg = await Attendance.aggregate([{ $match: match }, { $group: { _id: '$date', count: { $sum: 1 } } }]);
  const map = Object.fromEntries(agg.map((a) => [a._id, a.count]));
  return days.map((date) => ({ date, present: map[date] || 0 }));
};

const recentAnnouncements = (audience) =>
  Announcement.find({ audience: { $in: audience } })
    .populate('author', 'name')
    .sort({ pinned: -1, createdAt: -1 })
    .limit(4);

async function adminDashboard() {
  const today = toDateStr();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [children, staff, parents, classroomCount, todayRecords, unpaidAgg, collectedAgg, overdue, incidentsWeek] =
    await Promise.all([
      Child.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'staff', isActive: true }),
      User.countDocuments({ role: 'parent', isActive: true }),
      Classroom.countDocuments(),
      Attendance.find({ date: today }),
      Invoice.aggregate([{ $match: { status: 'unpaid' } }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
      Invoice.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Invoice.countDocuments({ status: 'unpaid', dueDate: { $lt: new Date() } }),
      Incident.countDocuments({ date: { $gte: weekAgo() } }),
    ]);

  const classrooms = await Classroom.find().select('name capacity').lean();
  const occ = await Child.aggregate([
    { $match: { status: 'active', classroom: { $ne: null } } },
    { $group: { _id: '$classroom', count: { $sum: 1 } } },
  ]);
  const occMap = Object.fromEntries(occ.map((o) => [String(o._id), o.count]));

  const recentIncidents = await Incident.find()
    .populate('child', 'firstName lastName')
    .sort({ date: -1 })
    .limit(5);

  return {
    stats: {
      children,
      staff,
      parents,
      classrooms: classroomCount,
      presentToday: todayRecords.filter((r) => r.status === 'present').length,
      checkedOutToday: todayRecords.filter((r) => r.checkOutTime).length,
      absentToday: todayRecords.filter((r) => r.status === 'absent').length,
      outstanding: unpaidAgg[0]?.total || 0,
      unpaidCount: unpaidAgg[0]?.count || 0,
      collectedThisMonth: collectedAgg[0]?.total || 0,
      overdueInvoices: overdue,
      incidentsThisWeek: incidentsWeek,
    },
    attendanceTrend: await attendanceTrend(),
    occupancy: classrooms.map((c) => ({ name: c.name, capacity: c.capacity, enrolled: occMap[String(c._id)] || 0 })),
    recentIncidents,
    announcements: await recentAnnouncements(['all', 'parents', 'staff']),
  };
}

async function staffDashboard(user) {
  const today = toDateStr();
  const myClassrooms = await Classroom.find({ staff: user._id }).select('name ageGroup capacity');
  const childFilter = myClassrooms.length
    ? { status: 'active', classroom: { $in: myClassrooms.map((c) => c._id) } }
    : { status: 'active' };
  const childIds = await Child.find(childFilter).distinct('_id');

  const [todayRecords, myLogsToday, incidentsWeek, allergyChildren] = await Promise.all([
    Attendance.find({ date: today, child: { $in: childIds } }),
    ActivityLog.countDocuments({ date: today, recordedBy: user._id }),
    Incident.countDocuments({ child: { $in: childIds }, date: { $gte: weekAgo() } }),
    Child.find({ _id: { $in: childIds }, 'allergies.0': { $exists: true } }).select('firstName lastName allergies'),
  ]);

  return {
    classrooms: myClassrooms,
    stats: {
      children: childIds.length,
      presentToday: todayRecords.filter((r) => r.status === 'present' && !r.checkOutTime).length,
      checkedOutToday: todayRecords.filter((r) => r.checkOutTime).length,
      absentToday: todayRecords.filter((r) => r.status === 'absent').length,
      notMarked: childIds.length - todayRecords.length,
      myLogsToday,
      incidentsThisWeek: incidentsWeek,
    },
    allergyAlerts: allergyChildren,
    attendanceTrend: await attendanceTrend({ child: { $in: childIds } }),
    announcements: await recentAnnouncements(['all', 'staff']),
  };
}

async function parentDashboard(user) {
  const today = toDateStr();
  const children = await Child.find({ parents: user._id }).populate('classroom', 'name').sort({ firstName: 1 });
  const ids = children.map((c) => c._id);

  const [todayRecords, recentLogs, unpaid, unreadMessages, pendingIncidents] = await Promise.all([
    Attendance.find({ date: today, child: { $in: ids } }),
    ActivityLog.find({ child: { $in: ids } })
      .populate('child', 'firstName')
      .populate('recordedBy', 'name')
      .sort({ date: -1, time: -1 })
      .limit(8),
    Invoice.find({ child: { $in: ids }, status: 'unpaid' }).populate('child', 'firstName').sort({ dueDate: 1 }),
    Message.countDocuments({ recipient: user._id, readAt: null }),
    Incident.find({ child: { $in: ids }, acknowledgedAt: null }).populate('child', 'firstName').sort({ date: -1 }),
  ]);

  const byChild = Object.fromEntries(todayRecords.map((r) => [String(r.child), r]));
  return {
    children: children.map((c) => ({ child: c, today: byChild[String(c._id)] || null })),
    stats: {
      children: children.length,
      outstanding: unpaid.reduce((s, i) => s + i.total, 0),
      unreadMessages,
      pendingIncidents: pendingIncidents.length,
    },
    recentLogs,
    unpaidInvoices: unpaid,
    pendingIncidents,
    announcements: await recentAnnouncements(['all', 'parents']),
  };
}

// @route GET /api/dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  const { role } = req.user;
  let data;
  if (role === 'admin') data = await adminDashboard();
  else if (role === 'staff') data = await staffDashboard(req.user);
  else data = await parentDashboard(req.user);
  res.json({ success: true, role, data });
});