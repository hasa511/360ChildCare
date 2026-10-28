import Incident from '../models/Incident.js';
import Child from '../models/Child.js';
import { asyncHandler, ApiError, pick } from '../utils/helpers.js';
import { buildChildFilter, ensureChildAccess } from '../utils/access.js';

const FIELDS = ['child', 'date', 'type', 'severity', 'location', 'description', 'actionTaken', 'parentNotified'];

const populate = (q) =>
  q
    .populate('child', 'firstName lastName parents')
    .populate('reportedBy', 'name position')
    .populate('acknowledgedBy', 'name');

// @route GET /api/incidents?child=&severity=&type=&status=pending|acknowledged
export const getIncidents = asyncHandler(async (req, res) => {
  const filter = await buildChildFilter(req.user, req.query.child);
  if (req.query.severity) filter.severity = req.query.severity;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status === 'pending') filter.acknowledgedAt = null;
  if (req.query.status === 'acknowledged') filter.acknowledgedAt = { $ne: null };

  const incidents = await populate(Incident.find(filter)).sort({ date: -1 });
  res.json({ success: true, count: incidents.length, data: incidents });
});

// @route GET /api/incidents/:id
export const getIncident = asyncHandler(async (req, res) => {
  const incident = await populate(Incident.findById(req.params.id));
  if (!incident) throw new ApiError(404, 'Incident not found');
  ensureChildAccess(req.user, incident.child);
  res.json({ success: true, data: incident });
});

// @route POST /api/incidents   (admin, staff)
export const createIncident = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (!(await Child.exists({ _id: data.child }))) throw new ApiError(400, 'Please select a valid child');
  const incident = await Incident.create({ ...data, reportedBy: req.user._id });
  res.status(201).json({ success: true, data: await populate(Incident.findById(incident._id)) });
});

// @route PUT /api/incidents/:id   (admin, staff)
export const updateIncident = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  delete data.child;
  const incident = await Incident.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!incident) throw new ApiError(404, 'Incident not found');
  res.json({ success: true, data: await populate(Incident.findById(incident._id)) });
});

// @route PUT /api/incidents/:id/acknowledge   (parent)
export const acknowledgeIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id).populate('child', 'parents');
  if (!incident) throw new ApiError(404, 'Incident not found');
  ensureChildAccess(req.user, incident.child);
  if (incident.acknowledgedAt) throw new ApiError(400, 'This report has already been acknowledged');

  incident.acknowledgedBy = req.user._id;
  incident.acknowledgedAt = new Date();
  incident.parentComment = req.body.comment;
  await incident.save();
  res.json({ success: true, data: await populate(Incident.findById(incident._id)) });
});

// @route DELETE /api/incidents/:id   (admin)
export const deleteIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findByIdAndDelete(req.params.id);
  if (!incident) throw new ApiError(404, 'Incident not found');
  res.json({ success: true, message: 'Incident deleted' });
});