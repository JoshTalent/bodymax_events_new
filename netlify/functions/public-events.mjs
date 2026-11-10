import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Registration from './_shared/models/Registration.js'
import { success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()
    const params = event.queryStringParameters || {}
    const { id } = params

    if (id) {
      const ev = await Event.findOne({ _id: id, public: true })
      if (!ev) return errorResponse({ message: 'Event not found', status: 404 })
      // Legacy professional events may still be stored as amateur. Promote them
      // once so the public page uses the fight-night layout.
      const hasProData = ev.pro && (ev.pro.promotionName || ev.pro.seriesName || ev.pro.sanctioningBody)
      if (ev.eventType !== 'professional' && hasProData) {
        ev.eventType = 'professional'
        ev.registrationOpen = false
        await ev.save()
      }
      return success({ event: ev.toObject() })
    }

    const events = await Event.find({ public: true })
      .sort({ eventDate: -1 })
      .lean()
    return success({ events })
  } catch (err) {
    return errorResponse(err)
  }
}
