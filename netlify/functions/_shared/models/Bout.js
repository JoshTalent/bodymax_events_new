import mongoose from 'mongoose'
import './Registration.js'
import './Event.js'
import './User.js'

const BoutSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    category: {
      weight: { type: String, default: '' },
      age: { type: String, default: '' },
      gender: { type: String, default: '' },
    },

    round: { type: Number, default: 1 }, // 1 = first round, 2 = second, etc.
    roundName: { type: String, default: '' }, // 'Preliminary', 'Quarter-final', etc.

    boutNumber: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    numberOfRounds: { type: Number, default: null, min: 1 },
    minutesPerRound: { type: Number, default: null, min: 1 },
    ring: { type: String, default: '' },
    scheduledDate: { type: Date, default: null },
    scheduledTime: { type: String, default: '' },

    // Positions in the bracket for automatic winner advancement
    bracketPosition: { type: Number, default: 0 },
    parentBoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bout',
      default: null,
    },
    // Which side of the parent bout this bout's winner feeds into
    feedSide: { type: String, enum: ['A', 'B'], default: null },

    // Professional fight night billing / title information
    boutType: { type: String, enum: ['main_event', 'co_main', 'undercard', 'prelim'], default: '' },
    billingOrder: { type: Number, default: 0 },
    titleFight: { type: Boolean, default: false },
    titleName: { type: String, default: '' },
    sanctioningBody: { type: String, default: '' },
    division: { type: String, default: '' },
    contractWeightKg: { type: Number, default: null },
    commissionApproved: { type: Boolean, default: false },

    boxerAId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
    boxerBId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
    loserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },

    status: {
      type: String,
      enum: ['scheduled', 'ready', 'in_progress', 'completed', 'postponed', 'cancelled', 'walkover'],
      default: 'scheduled',
    },

    result: {
      winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', default: null },
      method: { type: String, default: '' }, // Decision, KO, TKO, RSC, Disqualification, Walkover, Other
      proMethod: { type: String, default: '' }, // Unanimous Decision, Split Decision, Majority Decision, KO, TKO, RTD, DQ, NC, Walkover, Technical Decision, Technical Draw
      round: { type: Number, default: null },
      knockdownsA: { type: Number, default: 0 },
      knockdownsB: { type: Number, default: 0 },
      titleChanged: { type: Boolean, default: false },
      scorecards: [
        {
          judgeName: { type: String, default: '' },
          judgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
          boxerAScore: { type: Number, default: null },
          boxerBScore: { type: Number, default: null },
          boxerARounds: [{ type: Number, default: null }],
          boxerBRounds: [{ type: Number, default: null }],
        },
      ],
      notes: { type: String, default: '' },
      recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      recordedAt: { type: Date, default: null },
    },

    officials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

BoutSchema.index({ eventId: 1, boutNumber: 1 })

export default mongoose.models.Bout || mongoose.model('Bout', BoutSchema)
