import mongoose from 'mongoose'

const RegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    clubName: { type: String, trim: true, default: '' },
    numberOfBouts: { type: Number, default: 1, min: 1 },
    boxerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Boxer',
      required: true,
      index: true,
    },
    category: {
      weight: { type: String, default: '' },
      age: { type: String, default: '' },
      gender: { type: String, enum: ['', 'M', 'F'], default: '' },
    },

    status: {
      type: String,
      enum: [
        'registered',
        'pending_approval',
        'needs_correction',
        'approved',
        'awaiting_weighin',
        'weighed',
        'eligible',
        'not_eligible',
        'withdrawn',
        'eliminated',
        'completed',
      ],
      default: 'registered',
    },

    promoterFeedback: { type: String, default: '' },

    weighIn: {
      status: {
        type: String,
        enum: ['not_required', 'not_weighed', 'successful', 'outside_category', 'requires_review', 'withdrawn'],
        default: 'not_weighed',
      },
      officialWeightKg: { type: Number, default: null },
      weighedAt: { type: Date, default: null },
      weighedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      notes: { type: String, default: '' },
    },
  },
  { timestamps: true }
)

RegistrationSchema.index({ eventId: 1, boxerId: 1 }, { unique: true })

export default mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema)
