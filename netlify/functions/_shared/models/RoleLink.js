import mongoose from 'mongoose'

const RoleLinkSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['commentator', 'judge', 'official', 'mc'],
      required: true,
    },
    token: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

RoleLinkSchema.index({ eventId: 1, role: 1 }, { unique: true })

export default mongoose.models.RoleLink || mongoose.model('RoleLink', RoleLinkSchema)