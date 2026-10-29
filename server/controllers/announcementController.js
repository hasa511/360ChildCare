import Announcement from '../models/Announcement.js';
import { asyncHandler, ApiError, pick, sameId } from '../utils/helpers.js';

const FIELDS = ['title', 'body', 'category', 'audience', 'eventDate', 'pinned'];

const audienceFor = (role) => {
  if (role === 'parent') return ['all', 'parents'];
  if (role === 'staff') return ['all', 'staff'];
  return ['all', 'parents', 'staff'];
};

// @route GET /api/announcements?category=&upcoming=true&limit=
export const getAnnouncements = asyncHandler(async (req, res) => {
  const filter = { audience: { $in: audienceFor(req.user.role) } };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.upcoming === 'true') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    filter.eventDate = { $gte: start };
  }
  const sort = req.query.upcoming === 'true' ? { eventDate: 1 } : { pinned: -1, createdAt: -1 };
  const items = await Announcement.find(filter)
    .populate('author', 'name role position')
    .sort(sort)
    .limit(Math.min(Number(req.query.limit) || 50, 200));
  res.json({ success: true, count: items.length, data: items });
});

// @route POST /api/announcements   (admin, staff)
export const createAnnouncement = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (!data.eventDate) delete data.eventDate;
  const item = await Announcement.create({ ...data, author: req.user._id });
  res.status(201).json({ success: true, data: await item.populate('author', 'name role position') });
});

const loadOwned = async (req) => {
  const item = await Announcement.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Announcement not found');
  if (req.user.role !== 'admin' && !sameId(item.author, req.user._id)) {
    throw new ApiError(403, 'You can only modify your own announcements');
  }
  return item;
};

// @route PUT /api/announcements/:id   (admin or author)
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const item = await loadOwned(req);
  const data = pick(req.body, FIELDS);
  if (data.eventDate === '' || data.eventDate === null) {
    item.eventDate = undefined;
    delete data.eventDate;
  }
  Object.assign(item, data);
  await item.save();
  res.json({ success: true, data: await item.populate('author', 'name role position') });
});

// @route DELETE /api/announcements/:id   (admin or author)
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const item = await loadOwned(req);
  await item.deleteOne();
  res.json({ success: true, message: 'Announcement deleted' });
});