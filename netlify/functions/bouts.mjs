import { connectDB } from './_shared/db.js'
import Bout from './_shared/models/Bout.js'
import Registration from './_shared/models/Registration.js'
import Boxer from './_shared/models/Boxer.js'
import Club from './_shared/models/Club.js'
import { requireAuth, requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()
    const user = await requireAuth(event)

    const params = event.queryStringParameters || {}
    const { id } = params

    if (event.httpMethod === 'OPTIONS') return success({})

    if (event.httpMethod === 'GET') {
      // List bouts for an event (optionally filtered)
      const { eventId, weight = '', round } = params
      if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })
      const query = { eventId, 'category.weight': weight }
      if (round) query.round = Number(round)
      const bouts = await Bout.find(query)
        .sort({ sortOrder: 1, boutNumber: 1 })
        .populate({ path: 'boxerAId', populate: { path: 'boxerId' } })
        .populate({ path: 'boxerBId', populate: { path: 'boxerId' } })
        .populate({ path: 'winnerId', populate: { path: 'boxerId' } })
        .lean()
      return success({ bouts })
    }

    if (event.httpMethod === 'POST') {
      if (user.role !== 'promoter') {
        return errorResponse({ message: 'Forbidden', status: 403 })
      }
      // Reorder an event's bouts by setting sortOrder from the provided order of ids.
      const { eventId } = params
      if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })
      const body = JSON.parse(event.body || '{}')
      const { order } = body
      if (!Array.isArray(order)) return errorResponse({ message: 'order array required', status: 400 })

      const ops = order.map((boutId, idx) => ({
        updateOne: {
          filter: { _id: boutId },
          update: { $set: { sortOrder: idx } },
        },
      }))

      await Bout.bulkWrite(ops)

      const bouts = await Bout.find({ eventId })
        .sort({ sortOrder: 1, boutNumber: 1 })
        .populate({ path: 'boxerAId', populate: { path: 'boxerId' } })
        .populate({ path: 'boxerBId', populate: { path: 'boxerId' } })
        .populate({ path: 'winnerId', populate: { path: 'boxerId' } })
        .lean()
      return success({ bouts })
    }

    if (event.httpMethod === 'PATCH' || event.httpMethod === 'PUT') {
      if (user.role !== 'promoter') {
        return errorResponse({ message: 'Forbidden', status: 403 })
      }
      if (!id) return errorResponse({ message: 'Bout id required', status: 400 })

      const body = JSON.parse(event.body || '{}')
      const allowed = ['ring', 'scheduledDate', 'scheduledTime', 'status', 'officials']
      const update = {}
      for (const k of allowed) {
        if (body[k] !== undefined) update[k] = body[k]
      }
      const bout = await Bout.findByIdAndUpdate(id, update, { new: true }).lean()
      if (!bout) return errorResponse({ message: 'Bout not found', status: 404 })
      return success({ bout })
    }

    return errorResponse({ message: 'Method not allowed', status: 405 })
  } catch (err) {
    return errorResponse(err)
  }
}
