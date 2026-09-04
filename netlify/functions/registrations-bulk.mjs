import { connectDB } from './_shared/db.js'
import Registration from './_shared/models/Registration.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'POST') return errorResponse({ message: 'Method not allowed', status: 405 })

    const body = JSON.parse(event.body || '{}')
    const { eventId, action, clubName } = body

    if (action !== 'club_confirm') {
      return errorResponse({ message: 'Unknown action', status: 400 })
    }

    await connectDB()
    const query = { status: { $in: ['pending_approval', 'approved'] } }
    if (clubName) query.clubName = clubName
    if (eventId) query.eventId = eventId

    const regs = await Registration.find(query)
    for (const reg of regs) {
      reg.status = 'approved'
      await reg.save()
    }
    return success({ confirmed: regs.length })
  } catch (err) {
    return errorResponse(err)
  }
}
