import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'
import { normalizeWeightClasses, validateWeightClasses, weightCategoryLabels } from './_shared/weightClasses.js'

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

    const eventType = body.eventType === 'professional' ? 'professional' : 'amateur'

    let weightClasses
    if (Object.prototype.hasOwnProperty.call(body, 'weightClasses')) {
      const invalid = validateWeightClasses(body.weightClasses)
      if (invalid) return errorResponse({ message: invalid, status: 400 })
      weightClasses = normalizeWeightClasses(body.weightClasses)
    }

    await connectDB()
    const slug = slugify(body.name) + '-' + Date.now().toString(36)

    const eventData = {
      ...body,
      eventType,
      ...(eventType === 'professional' ? { pro: body.pro || {} } : {}),
      slug,
      createdBy: user._id,
      status: body.status || 'open',
      // Professional fight nights are promoter-managed: no public registration.
      registrationOpen: eventType === 'professional' ? false : body.registrationOpen !== undefined ? body.registrationOpen : true,
      public: body.public !== undefined ? body.public : true,
    }

    // Always keep the legacy label list in sync with the structured classes,
    // because registrations, draws and validation match on those strings.
    if (weightClasses) {
      eventData.weightClasses = weightClasses
      eventData.weightCategories = weightCategoryLabels(weightClasses)
    }

    const ev = await Event.create(eventData)
    return success({ event: ev }, 201)
  } catch (err) {
    return errorResponse(err)
  }
}
