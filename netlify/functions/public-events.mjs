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
      const ev = await Event.findOne({ _id: id, public: true }).lean()
      if (!ev) return errorResponse({ message: 'Event not found', status: 404 })
      return success({ event: ev })
    }

    const events = await Event.find({ public: true })
      .sort({ eventDate: -1 })
      .lean()
    return success({ events })
  } catch (err) {
    return errorResponse(err)
  }
}
