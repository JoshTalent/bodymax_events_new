import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    const user = await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') {
      return success({})
    }
    if (event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const body = JSON.parse(event.body || '{}')
    if (!body.name) {
      return errorResponse({ message: 'Event name is required', status: 400 })
    }

    await connectDB()
    const slug = slugify(body.name) + '-' + Date.now().toString(36)

    const eventData = {
      ...body,
      slug,
      createdBy: user._id,
      status: body.status || 'open',
      registrationOpen: body.registrationOpen !== undefined ? body.registrationOpen : true,
      public: body.public !== undefined ? body.public : true,
    }

    const ev = await Event.create(eventData)
    return success({ event: ev }, 201)
  } catch (err) {
    return errorResponse(err)
  }
}
