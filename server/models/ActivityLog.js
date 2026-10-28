import mongoose from 'mongoose';

export const ACTIVITY_TYPES = ['meal', 'nap', 'activity', 'toilet', 'mood', 'medication', 'note'];
export const MOODS = ['happy', 'calm', 'excited', 'tired', 'fussy', 'sad'];

const activityLogSchema = new mongoose.Schema(
  {
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'] },
    time: { type: String, required: true, match: [/^\d{2}:\d{2}$/, 'Time must be HH:mm'] },
    type: { type: String, enum: ACTIVITY_TYPES, required: [true, 'Activity type is required'] },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    details: { type: String, trim: true, maxlength: 1000 },
    mood: { type: String, enum: MOODS },
    mealAmount: { type: String, enum: ['all', 'most', 'some', 'none'] },
    durationMins: { type: Number, min: 0 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

activityLogSchema.index({ child: 1, date: -1, time: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);