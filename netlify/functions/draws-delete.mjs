import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Bout from './_shared/models/Bout.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const params = event.queryStringParameters || {}
    const { eventId } = params
    if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })

    const body = JSON.parse(event.body || '{}')
    await connectDB()

    const ev = await Event.findById(eventId)
    if (!ev) return errorResponse({ message: 'Event not found', status: 404 })

    let filter = { eventId }

    if (Array.isArray(body.boutIds) && body.boutIds.length > 0) {
      // Delete the exact bouts the promoter is looking at
      filter = { eventId, _id: { $in: body.boutIds } }
    } else if (body.weight || body.age || body.gender) {
      // Delete a whole category's draw
      const { weight = '', age = '', gender = '' } = body
      filter = {
        eventId,
        'category.weight': weight,
        'category.age': age,
        'category.gender': gender,
      }
    } else {
      // No scope given — clear the entire event's draw
      filter = { eventId }
    }

    const res = await Bout.deleteMany(filter)
    const remaining = await Bout.countDocuments({ eventId })

    return success({
      message: `Deleted ${res.deletedCount} bout${res.deletedCount === 1 ? '' : 's'}`,
      deleted: res.deletedCount,
      remaining,
    })
  } catch (err) {
    return errorResponse(err)
  }
}