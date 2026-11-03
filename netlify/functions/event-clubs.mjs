import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Club from './_shared/models/Club.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

// Clubs assigned to an event. Boxers are then entered into the event under one
// of these clubs, so the participant list stays event-scoped instead of global.
export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') return success({})

    await connectDB()

    const params = event.queryStringParameters || {}
    const method = event.httpMethod
    const body = method === 'GET' ? {} : JSON.parse(event.body || '{}')
    const eventId = params.eventId || body.eventId
    const clubId = params.clubId || body.clubId

    if (!eventId) {
      return errorResponse({ message: 'eventId is required', status: 400 })
    }

    const ev = await Event.findById(eventId)
    if (!ev) {
      return errorResponse({ message: 'Event not found', status: 404 })
    }

    if (method === 'GET') {
      await ev.populate('clubIds')
      return success({ clubs: ev.clubIds || [] })
    }

    if (!clubId) {
      return errorResponse({ message: 'clubId is required', status: 400 })
    }

    const club = await Club.findById(clubId)
    if (!club) {
      return errorResponse({ message: 'Club not found', status: 404 })
    }

    if (method === 'POST') {
      if (!ev.clubIds) ev.clubIds = []
      const already = ev.clubIds.some((id) => String(id) === String(clubId))
      if (!already) {
        ev.clubIds.push(club._id)
        await ev.save()
      }
      await ev.populate('clubIds')
      return success({ club, clubs: ev.clubIds || [], alreadyAssigned: already })
    }

    if (method === 'DELETE') {
      const boxers = await Boxer.find({ clubId: club._id }).select('_id').lean()
      const boxerIds = boxers.map((b) => b._id)
      const regs = boxerIds.length
        ? await Registration.find({ eventId: ev._id, boxerId: { $in: boxerIds } }).select('_id').lean()
        : []
      const force = params.force === 'true' || body.force === true

      if (regs.length && !force) {
        return success({
          requiresConfirmation: true,
          boxerCount: regs.length,
          message: `${club.name} has ${regs.length} boxer${regs.length === 1 ? '' : 's'} in this event.`,
        })
      }

      if (regs.length) {
        const regIds = regs.map((r) => r._id)
        await Bout.deleteMany({ $or: [{ boxerAId: { $in: regIds } }, { boxerBId: { $in: regIds } }] })
        await Registration.deleteMany({ _id: { $in: regIds } })
      }

      ev.clubIds = (ev.clubIds || []).filter((id) => String(id) !== String(clubId))
      await ev.save()
      await ev.populate('clubIds')
      return success({
        removed: true,
        boxersRemoved: regs.length,
        clubs: ev.clubIds || [],
      })
    }

    return errorResponse({ message: 'Method not allowed', status: 405 })
  } catch (err) {
    return errorResponse(err)
  }
}
