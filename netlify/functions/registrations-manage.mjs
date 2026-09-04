import { connectDB } from './_shared/db.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
import Event from './_shared/models/Event.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

function nextStatus(action, reg) {
  switch (action) {
    case 'approve':
      return {
        status: 'approved',
        promoterFeedback: '',
      }
    case 'needs_correction':
      return { status: 'needs_correction' }
    case 'reject':
      return { status: 'withdrawn' }
    case 'withdraw':
      return { status: 'withdrawn' }
    default:
      return null
  }
}

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') return success({})

    const params = event.queryStringParameters || {}
    const { id } = params
    if (!id) return errorResponse({ message: 'Registration id required', status: 400 })

    const body = JSON.parse(event.body || '{}')
    const { action, feedback } = body

    await connectDB()
    const reg = await Registration.findById(id)
    if (!reg) return errorResponse({ message: 'Registration not found', status: 404 })

    if (action === 'approve') {
      const st = nextStatus('approve', reg)
      reg.status = st.status
      if (feedback) reg.promoterFeedback = feedback
      await reg.save()
      return success({ registration: reg })
    }

    if (action === 'mark_eligible') {
      reg.status = 'eligible'
      reg.weighIn.status = 'successful'
      await reg.save()
      return success({ registration: reg })
    }

    if (action === 'mark_ineligible') {
      reg.status = 'not_eligible'
      reg.weighIn.status = reg.weighIn?.officialWeightKg ? 'outside_category' : 'requires_review'
      reg.weighIn.notes = feedback || reg.weighIn?.notes || ''
      await reg.save()

      // Award a walkover to the opponent in any live bout containing this boxer.
      const liveBouts = await Bout.find({
        eventId: reg.eventId,
        status: { $in: ['scheduled', 'ready', 'in_progress'] },
        $or: [{ boxerAId: reg._id }, { boxerBId: reg._id }],
      })
      for (const bout of liveBouts) {
        const opponentId =
          bout.boxerAId && String(bout.boxerAId) === String(reg._id) ? bout.boxerBId : bout.boxerAId
        bout.winnerId = opponentId || null
        bout.loserId = reg._id
        bout.status = 'walkover'
        bout.result = {
          winnerId: opponentId || null,
          method: 'Walkover',
          round: null,
          notes: 'Opponent ineligible after weigh-in',
          recordedAt: new Date(),
        }
        if (opponentId) {
          await Registration.updateOne({ _id: opponentId }, { $set: { status: 'completed' } })
        }
        await bout.save()
      }

      return success({ registration: reg, walkovers: liveBouts.length })
    }

    if (action === 'set_awaiting_weighin') {
      reg.status = 'awaiting_weighin'
      await reg.save()
      return success({ registration: reg })
    }

    const st = nextStatus(action, reg)
    if (st) {
      reg.status = st.status
      if (feedback) reg.promoterFeedback = feedback
      await reg.save()
      return success({ registration: reg })
    }

    return errorResponse({ message: 'Unknown action', status: 400 })
  } catch (err) {
    return errorResponse(err)
  }
}
