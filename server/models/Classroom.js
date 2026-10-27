import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Classroom name is required'], unique: true, trim: true },
    ageGroup: { type: String, required: [true, 'Age group is required'], trim: true },
    capacity: { type: Number, required: true, min: [1, 'Capacity must be at least 1'], default: 15 },
    monthlyFee: { type: Number, min: 0, default: 0 },
    roomNumber: { type: String, trim: true },
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Classroom', classroomSchema);