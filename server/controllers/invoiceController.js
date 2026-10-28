import Invoice from '../models/Invoice.js';
import Child from '../models/Child.js';
import { asyncHandler, ApiError, pick } from '../utils/helpers.js';
import { buildChildFilter, ensureChildAccess } from '../utils/access.js';

const FIELDS = ['period', 'items', 'discount', 'dueDate', 'notes'];
const PERIOD_RX = /^\d{4}-\d{2}$/;

const populate = (q) =>
  q.populate('child', 'firstName lastName parents classroom').populate('parent', 'name email phone');

// @route GET /api/invoices?status=&child=&period=&overdue=true
export const getInvoices = asyncHandler(async (req, res) => {
  const filter = await buildChildFilter(req.user, req.query.child);
  if (req.query.status) filter.status = req.query.status;
  if (req.query.period) filter.period = req.query.period;
  if (req.query.overdue === 'true') {
    filter.status = 'unpaid';
    filter.dueDate = { $lt: new Date() };
  }
  const invoices = await populate(Invoice.find(filter)).sort({ period: -1, createdAt: -1 });

  const summary = invoices.reduce(
    (acc, inv) => {
      if (inv.status === 'paid') acc.paid += inv.total;
      if (inv.status === 'unpaid') acc.outstanding += inv.total;
      if (inv.isOverdue) acc.overdue += inv.total;
      return acc;
    },
    { paid: 0, outstanding: 0, overdue: 0 }
  );
  res.json({ success: true, count: invoices.length, summary, data: invoices });
});

// @route GET /api/invoices/:id
export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await populate(Invoice.findById(req.params.id));
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  ensureChildAccess(req.user, invoice.child);
  res.json({ success: true, data: invoice });
});

// @route POST /api/invoices   (admin)
export const createInvoice = asyncHandler(async (req, res) => {
  const child = await Child.findById(req.body.child);
  if (!child) throw new ApiError(400, 'Please select a valid child');
  const invoice = await Invoice.create({
    ...pick(req.body, FIELDS),
    child: child._id,
    parent: child.parents[0],
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: await populate(Invoice.findById(invoice._id)) });
});

// @route POST /api/invoices/generate   (admin)
// Creates a monthly tuition invoice for every active child with a classroom fee,
// skipping children who already have an invoice for that period.
export const generateMonthlyInvoices = asyncHandler(async (req, res) => {
  const { period, dueDate, extraItems = [] } = req.body;
  if (!PERIOD_RX.test(period || '')) throw new ApiError(400, 'Period must be in YYYY-MM format');
  if (!dueDate) throw new ApiError(400, 'Due date is required');

  const children = await Child.find({ status: 'active', classroom: { $ne: null } }).populate('classroom', 'name monthlyFee');
  const existing = new Set(
    (await Invoice.find({ period, status: { $ne: 'cancelled' } }).distinct('child')).map(String)
  );

  const validExtras = extraItems.filter((i) => i?.description && Number(i.amount) > 0);
  const toCreate = children
    .filter((c) => !existing.has(String(c._id)) && c.classroom?.monthlyFee > 0)
    .map((c) => ({
      child: c._id,
      parent: c.parents[0],
      period,
      dueDate,
      items: [{ description: `Monthly tuition - ${c.classroom.name}`, amount: c.classroom.monthlyFee }, ...validExtras],
      createdBy: req.user._id,
    }));

  const created = [];
  for (const data of toCreate) {
    // eslint-disable-next-line no-await-in-loop
    created.push(await Invoice.create(data));
  }
  res.status(201).json({
    success: true,
    message: `Generated ${created.length} invoice(s); skipped ${children.length - created.length}`,
    count: created.length,
  });
});

// @route PUT /api/invoices/:id   (admin) - only unpaid invoices can be edited
export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  if (invoice.status !== 'unpaid') throw new ApiError(400, `A ${invoice.status} invoice cannot be edited`);
  Object.assign(invoice, pick(req.body, FIELDS));
  await invoice.save();
  res.json({ success: true, data: await populate(Invoice.findById(invoice._id)) });
});

// @route PUT /api/invoices/:id/pay   (admin records payment; parent pays online - simulated)
export const payInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('child', 'parents');
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  ensureChildAccess(req.user, invoice.child);
  if (invoice.status !== 'unpaid') throw new ApiError(400, `Invoice is already ${invoice.status}`);

  const isParent = req.user.role === 'parent';
  invoice.status = 'paid';
  invoice.paidAt = new Date();
  invoice.paymentMethod = isParent ? 'online' : req.body.paymentMethod || 'cash';
  invoice.paymentReference =
    req.body.paymentReference || (isParent ? `ONL-${Date.now().toString(36).toUpperCase()}` : undefined);
  await invoice.save();
  res.json({ success: true, message: 'Payment recorded', data: await populate(Invoice.findById(invoice._id)) });
});

// @route PUT /api/invoices/:id/cancel   (admin)
export const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  if (invoice.status === 'paid') throw new ApiError(400, 'A paid invoice cannot be cancelled');
  invoice.status = 'cancelled';
  await invoice.save();
  res.json({ success: true, data: invoice });
});

// @route DELETE /api/invoices/:id   (admin)
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  res.json({ success: true, message: 'Invoice deleted' });
});