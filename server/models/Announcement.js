import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    body: { type: String, required: [true, 'Content is required'], trim: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ['general', 'event', 'holiday', 'health', 'reminder'],
      default: 'general',
    },
    audience: { type: String, enum: ['all', 'parents', 'staff'], default: 'all' },
    eventDate: Date,
    pinned: { type: Boolean, default: false },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Announcement', announcementSchema);