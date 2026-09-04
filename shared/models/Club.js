import mongoose from 'mongoose'

const ClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true, default: '' },
    contactEmail: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    logoUrl: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

ClubSchema.virtual('boxerCount', {
  ref: 'Boxer',
  localField: '_id',
  foreignField: 'clubId',
  count: true,
})

ClubSchema.set('toJSON', { virtuals: true })

export default mongoose.models.Club || mongoose.model('Club', ClubSchema)
