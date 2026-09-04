import mongoose from 'mongoose'
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
    const user = await requireAuth(event)

    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    // Only promoter or results official
    if (user.role !== 'promoter' && !(user.role === 'official' && user.officialRole === 'results')) {
      return errorResponse({ message: 'Forbidden', status: 403 })
    }

    const params = event.queryStringParameters || {}
    const { id } = params
    if (!id) return errorResponse({ message: 'Bout id required', status: 400 })

    const body = JSON.parse(event.body || '{}')
    const { winnerId, method, round, notes } = body

    if (!winnerId) return errorResponse({ message: 'winnerId required', status: 400 })

    await connectDB()

    const bout = await Bout.findById(id)
    if (!bout) return errorResponse({ message: 'Bout not found', status: 404 })

    // Determine winner/loser
    const winnerIsA = bout.boxerAId && String(bout.boxerAId) === String(winnerId)
    const winnerIsB = bout.boxerBId && String(bout.boxerBId) === String(winnerId)
    if (!winnerIsA && !winnerIsB) {
      return errorResponse({ message: 'Winner must be one of the two boxers in this bout', status: 400 })
    }

    const loserId = String(winnerIsA ? bout.boxerBId : bout.boxerAId) || null

    bout.winnerId = winnerId
    bout.loserId = loserId
    bout.status = 'completed'
    bout.result = {
      winnerId,
      method: method || 'Decision',
      round: round || null,
      notes: notes || '',
      recordedBy: user._id,
      recordedAt: new Date(),
    }

    // Update registration statuses: winner advances, loser eliminated or completed
    await Registration.updateOne({ _id: winnerId }, { $set: { status: 'completed' } })
    if (loserId) {
      // Loser in final => completed (runner-up), otherwise eliminated
      await Registration.updateOne({ _id: loserId }, { $set: { status: bout.parentBoutId ? 'eliminated' : 'completed' } })
    }

    await bout.save()

    // Advance winner to parent bout
    if (bout.parentBoutId) {
      await advanceWinnerToParent(bout.parentBoutId, winnerId, bout.feedSide)
    }

    // Re-fetch with populated data
    const fresh = await Bout.findById(id)
      .populate({ path: 'boxerAId', populate: { path: 'boxerId' } })
      .populate({ path: 'boxerBId', populate: { path: 'boxerId' } })
      .populate({ path: 'winnerId', populate: { path: 'boxerId' } })
      .lean()

    return success({ bout: fresh })
  } catch (err) {
    return errorResponse(err)
  }
}

async function advanceWinnerToParent(parentBoutId, winnerId, feedSide) {
  const parent = await Bout.findById(parentBoutId)
  if (!parent) return

  const update =
    feedSide === 'A'
      ? { boxerAId: winnerId, status: parent.boxerBId ? 'scheduled' : 'ready' }
      : { boxerBId: winnerId, status: parent.boxerAId ? 'scheduled' : 'ready' }

  await Bout.updateOne({ _id: parent._id }, { $set: update })

  // If the parent now has both boxers, it's ready; if both were present it was scheduled already.
  return parent
}
