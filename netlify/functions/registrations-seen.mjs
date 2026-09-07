import { connectDB } from './_shared/db.js'
import User from './_shared/models/User.js'
import { requireAuth, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    const user = await requireAuth(event)
    if (!['promoter', 'official'].includes(user.role)) {
      throw Object.assign(new Error('You do not have permission'), { status: 403 })
    }
    await connectDB()
    await User.updateOne({ _id: user._id }, { $set: { lastSeenRegistrationsAt: new Date() } })
    return success({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}