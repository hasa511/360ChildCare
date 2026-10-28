import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ['injury', 'illness', 'behavior', 'other'], required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    location: { type: String, trim: true },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 2000 },
    actionTaken: { type: String, trim: true, maxlength: 2000 },
    parentNotified: { type: Boolean, default: false },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: Date,
    parentComment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.model('Incident', incidentSchema);