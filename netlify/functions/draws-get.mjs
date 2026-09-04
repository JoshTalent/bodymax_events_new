import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Club from './_shared/models/Club.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
import { requireAuth, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    const user = await requireAuth(event)

    const params = event.queryStringParameters || {}
    const { eventId, weight = '', age = '', gender = '' } = params
    if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })

    await connectDB()

    const query = { eventId }
    if (weight) query['category.weight'] = weight
    if (age) query['category.age'] = age
    if (gender) query['category.gender'] = gender

    const bouts = await Bout.find(query)
      .sort({ sortOrder: 1, round: 1, bracketPosition: 1 })
      .populate({
        path: 'boxerAId',
        populate: { path: 'boxerId' },
      })
      .populate({
        path: 'boxerBId',
        populate: { path: 'boxerId' },
      })
      .populate({
        path: 'winnerId',
        populate: { path: 'boxerId' },
      })
      .lean()

    // Group by round
    const byRound = {}
    for (const b of bouts) {
      if (!byRound[b.round]) byRound[b.round] = []
      byRound[b.round].push(b)
    }

    return success({ bouts, byRound })
  } catch (err) {
    return errorResponse(err)
  }
}
