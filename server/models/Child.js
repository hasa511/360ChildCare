import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Contact name is required'], trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, required: [true, 'Contact phone is required'], trim: true },
  },
  { _id: false }
);

const childSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    dateOfBirth: { type: Date, required: [true, 'Date of birth is required'] },
    gender: { type: String, enum: ['male', 'female', 'other'], required: [true, 'Gender is required'] },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    allergies: [{ type: String, trim: true }],
    medicalNotes: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    emergencyContacts: [contactSchema],
    authorizedPickups: [contactSchema],
    enrollmentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive', 'withdrawn'], default: 'active' },
    notes: { type: String, trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

childSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

childSchema.virtual('age').get(function age() {
  if (!this.dateOfBirth) return null;
  const now = new Date();
  const dob = new Date(this.dateOfBirth);
  let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (now.getDate() < dob.getDate()) months -= 1;
  if (months < 0) return '0m';
  const y = Math.floor(months / 12);
  const m = months % 12;
  return y > 0 ? `${y}y ${m}m` : `${m}m`;
});

childSchema.index({ firstName: 'text', lastName: 'text' });

export default mongoose.model('Child', childSchema);