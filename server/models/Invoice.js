import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: [true, 'Item description is required'], trim: true },
    amount: { type: Number, required: [true, 'Item amount is required'], min: [0, 'Amount cannot be negative'] },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    period: {
      type: String,
      required: [true, 'Billing period is required'],
      match: [/^\d{4}-\d{2}$/, 'Period must be YYYY-MM'],
    },
    items: {
      type: [itemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'Invoice must have at least one item'],
    },
    discount: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    status: { type: String, enum: ['unpaid', 'paid', 'cancelled'], default: 'unpaid' },
    paidAt: Date,
    paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'online'] },
    paymentReference: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

invoiceSchema.virtual('isOverdue').get(function isOverdue() {
  return this.status === 'unpaid' && this.dueDate && this.dueDate < new Date();
});

invoiceSchema.pre('validate', function computeTotals() {
  const subtotal = (this.items || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  this.total = Math.max(0, subtotal - (this.discount || 0));
  if (!this.invoiceNumber) {
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    this.invoiceNumber = `INV-${(this.period || '').replace('-', '')}-${rand}`;
  }
});

invoiceSchema.index({ child: 1, period: 1 });

export default mongoose.model('Invoice', invoiceSchema);