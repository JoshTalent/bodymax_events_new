import { connectDB } from './_shared/db.js'
import User from './_shared/models/User.js'
import { requireAuth, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    const user = await requireAuth(event)
    await connectDB()
    const fresh = await User.findById(user._id).lean()
    return success({
      user: {
        id: fresh._id,
        name: fresh.name,
        email: fresh.email,
        role: fresh.role,
        clubId: fresh.clubId,
        officialRole: fresh.officialRole,
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
