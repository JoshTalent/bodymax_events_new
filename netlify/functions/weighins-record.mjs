import { connectDB } from './_shared/db.js'
import Registration from './_shared/models/Registration.js'
import Event from './_shared/models/Event.js'
import { requireAuth, requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    const user = await requireAuth(event)

    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'PUT' && event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const params = event.queryStringParameters || {}
    const { registrationId } = params
    if (!registrationId) return errorResponse({ message: 'registrationId required', status: 400 })

    const body = JSON.parse(event.body || '{}')
    const { officialWeightKg, notes } = body
    if (officialWeightKg == null) {
      return errorResponse({ message: 'officialWeightKg required', status: 400 })
    }

    // Only promoter or weigh-in officials can record weigh-ins
    if (user.role !== 'promoter' && !(user.role === 'official' && user.officialRole === 'weighin')) {
      return errorResponse({ message: 'Forbidden', status: 403 })
    }

    await connectDB()
    const reg = await Registration.findById(registrationId)
    if (!reg) return errorResponse({ message: 'Registration not found', status: 404 })

    const weight = Number(officialWeightKg)

    reg.weighIn = {
      status: 'successful',
      officialWeightKg: weight,
      weighedAt: new Date(),
      weighedBy: user._id,
      notes: notes || '',
    }

    if (['payment_confirmed', 'awaiting_weighin', 'approved'].includes(reg.status)) {
      reg.status = 'weighed'
    }

    await reg.save()
    return success({ registration: reg })
  } catch (err) {
    return errorResponse(err)
  }
}
