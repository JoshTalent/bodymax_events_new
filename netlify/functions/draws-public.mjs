import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Bout from './_shared/models/Bout.js'
import { success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

// Public, read-only view of an event's draw. Keyed by the event's registration
// token so the link is unguessable and conveys no write permissions.
export default async (event) => {
  event = await normalizeRequest(event)
  try {
    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'GET') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const params = event.queryStringParameters || {}
    const { token } = params
    if (!token) return errorResponse({ message: 'token required', status: 400 })

    await connectDB()

    const ev = await Event.findOne({ registrationToken: token })
    if (!ev) return errorResponse({ message: 'Invalid or expired link', status: 404 })

    const bouts = await Bout.find({ eventId: ev._id })
      .sort({ sortOrder: 1, boutNumber: 1 })
      .populate({ path: 'boxerAId', populate: { path: 'boxerId' } })
      .populate({ path: 'boxerBId', populate: { path: 'boxerId' } })
      .populate({ path: 'winnerId', populate: { path: 'boxerId' } })
      .lean()

    return success({ event: ev, bouts })
  } catch (err) {
    return errorResponse(err)
  }
}