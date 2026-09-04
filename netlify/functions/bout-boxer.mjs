import { connectDB } from './_shared/db.js'
import Bout from './_shared/models/Bout.js'
import Registration from './_shared/models/Registration.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const params = event.queryStringParameters || {}
    const { boutId, eventId } = params
    if (!boutId) return errorResponse({ message: 'boutId required', status: 400 })

    const body = JSON.parse(event.body || '{}')
    const action = body.action || ''
    const side = body.side || ''

    await connectDB()

    const bout = await Bout.findById(boutId)
    if (!bout) return errorResponse({ message: 'Bout not found', status: 404 })

    if (action === 'remove') {
      if (side !== 'A' && side !== 'B') return errorResponse({ message: 'side must be A or B', status: 400 })

      const target = side === 'A' ? bout.boxerAId : bout.boxerBId
      if (!target) return errorResponse({ message: 'That slot is empty', status: 400 })

      // Remove the boxer and award a walkover to the remaining opponent.
      const opponentId = side === 'A' ? bout.boxerBId : bout.boxerAId
      if (side === 'A') bout.boxerAId = null
      else bout.boxerBId = null

      bout.winnerId = opponentId || null
      bout.loserId = target
      bout.status = 'walkover'
      bout.result = {
        winnerId: opponentId || null,
        method: 'Walkover',
        round: null,
        notes: 'Removed from draw',
        recordedAt: new Date(),
      }
      if (opponentId) {
        await Registration.updateOne({ _id: opponentId }, { $set: { status: 'completed' } })
      }
      await bout.save()

      const fresh = await Bout.findById(boutId)
        .populate({ path: 'boxerAId', populate: { path: 'boxerId' } })
        .populate({ path: 'boxerBId', populate: { path: 'boxerId' } })
        .populate({ path: 'winnerId', populate: { path: 'boxerId' } })
        .lean()
      return success({ bout: fresh })
    }

    if (action === 'swap') {
      // Swap the two boxers in this bout (A<->B).
      const tmp = bout.boxerAId
      bout.boxerAId = bout.boxerBId
      bout.boxerBId = tmp
      await bout.save()
      const fresh = await Bout.findById(boutId)
        .populate({ path: 'boxerAId', populate: { path: 'boxerId' } })
        .populate({ path: 'boxerBId', populate: { path: 'boxerId' } })
        .populate({ path: 'winnerId', populate: { path: 'boxerId' } })
        .lean()
      return success({ bout: fresh })
    }

    return errorResponse({ message: 'Unknown action', status: 400 })
  } catch (err) {
    return errorResponse(err)
  }
}
