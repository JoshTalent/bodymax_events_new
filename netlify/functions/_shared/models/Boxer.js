import mongoose from 'mongoose'

const BoxerSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      default: null,
      index: true,
    },
    clubName: { type: String, trim: true, default: '' },
    numberOfBouts: { type: Number, default: 1, min: 1 },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['M', 'F', null], default: null },
    nationality: { type: String, trim: true, default: '' },
    identificationNumber: { type: String, trim: true, default: '' },
    photoUrl: { type: String, default: '' },
    registeredWeightKg: { type: Number, default: null },
    weightCategory: { type: String, trim: true, default: '' },
    ageCategory: { type: String, trim: true, default: '' },
    experience: { type: String, trim: true, default: '' },
    boxingRecord: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
    },
    documents: [{ type: String }],
    notes: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Boxer || mongoose.model('Boxer', BoxerSchema)
