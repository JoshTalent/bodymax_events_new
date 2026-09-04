import crypto from 'crypto'
import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import RoleLink from './_shared/models/RoleLink.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

const ROLES = ['commentator', 'judge', 'official', 'mc']

export function generateToken() {
  return crypto.randomBytes(24).toString('hex')
}

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()
    const user = await requireRole('promoter')(event)

    const params = event.queryStringParameters || {}
    const { eventId } = params
    if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })

    const ev = await Event.findById(eventId)
    if (!ev) return errorResponse({ message: 'Event not found', status: 404 })
    // Legacy events may have no owner recorded; any promoter may manage those.
    if (ev.createdBy && String(ev.createdBy) !== String(user._id)) {
      return errorResponse({ message: 'You do not own this event', status: 403 })
    }

    if (event.httpMethod === 'GET') {
      const links = await RoleLink.find({ eventId }).lean()
      return success({ links })
    }

    if (event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const body = JSON.parse(event.body || '{}')
    const role = body.role || params.role
    if (!ROLES.includes(role)) return errorResponse({ message: 'Invalid role', status: 400 })

    const action = body.action || 'create'

    if (action === 'create') {
      const existing = await RoleLink.findOne({ eventId, role })
      if (existing) return success({ link: existing })
      const link = await RoleLink.create({ eventId, role, token: generateToken(), active: true })
      return success({ link }, 201)
    }

    if (action === 'regenerate') {
      const link = await RoleLink.findOneAndUpdate(
        { eventId, role },
        { token: generateToken(), active: true, lastUsedAt: null },
        { new: true, upsert: true }
      )
      return success({ link })
    }

    if (action === 'toggle') {
      const link = await RoleLink.findOne({ eventId, role })
      if (!link) return errorResponse({ message: 'No link exists yet', status: 404 })
      link.active = !link.active
      await link.save()
      return success({ link })
    }

    if (action === 'remove') {
      await RoleLink.deleteOne({ eventId, role })
      return success({ message: 'Portal link removed' })
    }

    if (action === 'touched') {
      await RoleLink.updateOne({ eventId, role }, { lastUsedAt: new Date() })
      return success({ ok: true })
    }

    return errorResponse({ message: 'Unknown action', status: 400 })
  } catch (err) {
    return errorResponse(err)
  }
}