import mongoose from 'mongoose'

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true },
    description: { type: String, default: '' },

    venue: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    eventDate: { type: Date, default: null },

    registrationOpens: { type: Date, default: null },
    registrationDeadline: { type: Date, default: null },
    weighInDate: { type: Date, default: null },
    competitionDates: [{ type: Date }],

    weightCategories: [{ type: String }],
    ageCategories: [{ type: String }],
    genderCategories: [{ type: String, enum: ['M', 'F', 'Mixed'] }],

    rules: { type: String, default: '' },
    registrationRequirements: { type: String, default: '' },

    feeStructure: {
      type: {
        type: String,
        enum: ['none', 'per_boxer', 'per_club'],
        default: 'none',
      },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: '' },
      notes: { type: String, default: '' },
    },

    paymentAccount: {
      bankName: { type: String, default: '' },
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      paymentInstructions: { type: String, default: '' },
      acceptedMethods: [{ type: String }],
    },

    requirePayment: { type: Boolean, default: false },
    requireWeighIn: { type: Boolean, default: true },

    registrationOpen: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'in_progress', 'completed', 'archived'],
      default: 'draft',
    },

    public: { type: Boolean, default: false },
    published: {
      announcements: [{ type: String }],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

export default mongoose.models.Event || mongoose.model('Event', EventSchema)
