import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') {
      return success({})
    }
    if (event.httpMethod !== 'PUT' && event.httpMethod !== 'POST' && event.httpMethod !== 'PATCH') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const params = event.queryStringParameters || {}
    const { id } = params
    if (!id) {
      return errorResponse({ message: 'Event id required', status: 400 })
    }

    const body = JSON.parse(event.body || '{}')
    await connectDB()

    const existing = await Event.findById(id)
    if (!existing) {
      return errorResponse({ message: 'Event not found', status: 404 })
    }

    if (body.registrationToken !== undefined && body.registrationToken === null) {
      delete body.registrationToken
    }

    let ev
    if (existing.registrationToken) {
      ev = await Event.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
    } else {
      existing.set(body)
      await existing.save()
      ev = existing.toObject()
    }
    return success({ event: ev })
  } catch (err) {
    return errorResponse(err)
  }
}
