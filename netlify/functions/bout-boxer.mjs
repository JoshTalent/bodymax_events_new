import { connectDB } from './_shared/db.js'
import Bout from './_shared/models/Bout.js'
import Registration from './_shared/models/Registration.js'
import Boxer from './_shared/models/Boxer.js'
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

    if (action === 'assign') {
      // Fill an empty slot ("Bye") with a registered boxer.
      if (side !== 'A' && side !== 'B') return errorResponse({ message: 'side must be A or B', status: 400 })

      const { registrationId } = body
      if (!registrationId) return errorResponse({ message: 'registrationId required', status: 400 })

      const target = side === 'A' ? bout.boxerAId : bout.boxerBId
      if (target) return errorResponse({ message: 'That slot already has a boxer', status: 400 })

      const other = side === 'A' ? bout.boxerBId : bout.boxerAId
      if (other && String(other) === String(registrationId)) {
        return errorResponse({ message: 'This boxer is already on the other side', status: 400 })
      }

      const reg = await Registration.findOne({ _id: registrationId, eventId: bout.eventId })
      if (!reg) return errorResponse({ message: 'Selected boxer is not registered in this event', status: 400 })

      // A boxer can only occupy one slot per event (any bout).
      const alreadyPlaced = await Bout.exists({
        eventId: bout.eventId,
        _id: { $ne: bout._id },
        $or: [{ boxerAId: registrationId }, { boxerBId: registrationId }],
      })
      if (alreadyPlaced) {
        return errorResponse({ message: 'This boxer is already placed in another bout', status: 400 })
      }

      if (side === 'A') bout.boxerAId = registrationId
      else bout.boxerBId = registrationId

      if (bout.boxerAId && bout.boxerBId) {
        // Both slots filled — back to a real scheduled bout.
        bout.status = 'scheduled'
        bout.winnerId = null
        bout.loserId = null
        bout.result = null
      } else {
        // Still a bye — the lone boxer takes the walkover.
        const lone = bout.boxerAId || bout.boxerBId
        bout.status = 'walkover'
        bout.winnerId = lone
        bout.loserId = null
        bout.result = {
          winnerId: lone,
          method: 'Walkover',
          round: null,
          notes: 'Bye in draw',
          recordedAt: new Date(),
        }
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
