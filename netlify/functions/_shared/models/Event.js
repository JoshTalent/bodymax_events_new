import mongoose from 'mongoose'
import crypto from 'crypto'

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

    // Structured weight classes: { name, minKg, maxKg }. `maxKg: null` means
    // an open-ended class ("Over 92 kg"). `weightCategories` below stays in
    // sync as the derived display labels used by registrations and draws.
    weightClasses: [
      {
        _id: false,
        name: { type: String, trim: true, default: '' },
        minKg: { type: Number, default: null },
        maxKg: { type: Number, default: null },
        // Legacy display override, preserved so old category strings never change.
        label: { type: String, trim: true, default: '' },
      },
    ],
    weightCategories: [{ type: String }],
    ageCategories: [{ type: String }],
    genderCategories: [{ type: String, enum: ['M', 'F', 'Mixed'] }],

    rules: { type: String, default: '' },
    registrationRequirements: { type: String, default: '' },

    registrationToken: { type: String, unique: true, sparse: true },

    // Clubs assigned to this event. Club boxers can then be entered into the event.
    clubIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],

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

EventSchema.pre('save', async function () {
  if (!this.registrationToken) {
    this.registrationToken = crypto.randomBytes(16).toString('hex')
  }
})

export default mongoose.models.Event || mongoose.model('Event', EventSchema)
