import mongoose from 'mongoose'
import crypto from 'crypto'

const ProEventSchema = new mongoose.Schema(
  {
    seriesName: { type: String, trim: true, default: '' },
    eventNumber: { type: Number, default: null },
    tagline: { type: String, trim: true, default: '' },
    posterUrl: { type: String, trim: true, default: '' },
    promotionName: { type: String, trim: true, default: '' },
    coPromoters: [{ type: String, trim: true, default: '' }],
    sanctioningBody: { type: String, trim: true, default: '' },
    broadcast: {
      network: { type: String, trim: true, default: '' },
      streamUrl: { type: String, trim: true, default: '' },
      payPerView: { type: Boolean, default: false },
    },
    ticketing: {
      url: { type: String, trim: true, default: '' },
      currency: { type: String, trim: true, default: 'USD' },
      priceFrom: { type: Number, default: null },
    },
    doorsOpen: { type: String, default: '' },
    firstBell: { type: String, default: '' },
    weighInVenue: { type: String, trim: true, default: '' },
    rulesMeetingAt: { type: Date, default: null },
    medicalOfficer: { type: String, trim: true, default: '' },
    matchmaker: { type: String, trim: true, default: '' },
    ringAnnouncer: { type: String, trim: true, default: '' },
    capacity: { type: Number, default: null },
  },
  { _id: false }
)

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true },
    description: { type: String, default: '' },

    // 'amateur' (club / tournament flow) or 'professional' (fight night flow).
    // Professional events skip the public registration link entirely and are
    // driven by the promoter-managed roster instead.
    eventType: { type: String, enum: ['amateur', 'professional'], default: 'amateur' },
    pro: { type: ProEventSchema, default: undefined },

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
  // Professional fight nights are promoter-managed and never expose a public
  // registration link, so no token is generated for them.
  if (!this.eventType || this.eventType === 'amateur') {
    if (!this.registrationToken) {
      this.registrationToken = crypto.randomBytes(16).toString('hex')
    }
  }
})

export default mongoose.models.Event || mongoose.model('Event', EventSchema)
