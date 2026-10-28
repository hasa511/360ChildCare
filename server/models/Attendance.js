import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    status: { type: String, enum: ['present', 'absent'], default: 'present' },
    checkInTime: Date,
    checkOutTime: Date,
    droppedOffBy: { type: String, trim: true },
    pickedUpBy: { type: String, trim: true },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedOutBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    absenceReason: { type: String, trim: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// One attendance record per child per day
attendanceSchema.index({ child: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

export default mongoose.model('Attendance', attendanceSchema);