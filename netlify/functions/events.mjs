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
    const { id, isPublic, eventType } = params

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
      // Legacy events created before event types existed can carry a populated
      // professional block while still being stored as amateur. Promote them
      // once so the professional cockpit and roster work on those events.
      const hasProData = ev.pro && (ev.pro.promotionName || ev.pro.seriesName || ev.pro.sanctioningBody)
      if (ev.eventType !== 'professional' && hasProData) {
        ev.eventType = 'professional'
        ev.registrationOpen = false
        await ev.save()
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

    if (eventType) {
      query.eventType = eventType
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

