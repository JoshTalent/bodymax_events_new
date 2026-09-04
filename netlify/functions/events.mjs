import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Registration from './_shared/models/Registration.js'
import { requireAuth, requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()

    const params = event.queryStringParameters || {}
    const { id, isPublic } = params

    if (id && event.httpMethod === 'DELETE') {
      await requireRole('promoter')(event)
      const ev = await Event.findById(id)
      if (!ev) {
        return errorResponse({ message: 'Event not found', status: 404 })
      }
      await Registration.deleteMany({ eventId: ev._id })
      await ev.deleteOne()
      return success({ message: 'Event deleted' })
    }

    const user = await requireAuth(event)

    if (id) {
      const ev = await Event.findById(id)
      if (!ev) {
        return errorResponse({ message: 'Event not found', status: 404 })
      }
      if (!ev.registrationToken) {
        ev.registrationToken = undefined
        await ev.save()
      }
      return success({ event: ev.toObject() })
    }

    let query = {}

    if (isPublic === 'true') {
      query = { public: true }
    }

    if (user.role === 'club') {
      query = { ...query }
    }

    const events = await Event.find(query)
      .sort({ eventDate: -1 })
      .lean()

    for (const ev of events) {
      ev.registrationCount = await Registration.countDocuments({ eventId: ev._id })
      ev.approvedCount = await Registration.countDocuments({ eventId: ev._id, status: { $in: ['approved', 'payment_pending', 'payment_confirmed', 'awaiting_weighin', 'weighed', 'eligible', 'eliminated', 'completed'] } })
    }

    return success({ events })
  } catch (err) {
    return errorResponse(err)
  }
}

