import mongoose from 'mongoose'
import { connectDB } from './_shared/db.js'
import Bout from './_shared/models/Bout.js'
import Registration from './_shared/models/Registration.js'
import Boxer from './_shared/models/Boxer.js'
import Club from './_shared/models/Club.js'
import { requireAuth, requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

const AMATEUR_METHODS = ['Decision', 'KO', 'TKO', 'RSC', 'Disqualification', 'Walkover', 'Other']
const PRO_METHODS = [
  'Unanimous Decision',
  'Split Decision',
  'Majority Decision',
  'KO',
  'TKO',
  'RTD',
  'Disqualification',
  'No Contest',
  'Walkover',
  'Technical Decision',
  'Technical Draw',
]

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
    const {
      winnerId,
      method,
      proMethod,
      round,
      knockdownsA,
      knockdownsB,
      titleChanged,
      scorecards,
      notes,
    } = body

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

    // Resolve event type to pick the right method validation
    const evt = await (import('./_shared/models/Event.js').then((m) => m.default)).then((M) => M.findById(bout.eventId).lean())
    const isPro = evt && evt.eventType === 'professional'
    const chosenMethod = isPro && proMethod ? proMethod : method || 'Decision'

    // Validate method against the allowed set for this event type
    const allowed = isPro ? PRO_METHODS : AMATEUR_METHODS
    if (!allowed.includes(chosenMethod)) {
      return errorResponse({ message: `Invalid method for ${isPro ? 'professional' : 'amateur'} event`, status: 400 })
    }

    bout.winnerId = winnerId
    bout.loserId = loserId
    bout.status = 'completed'
    bout.result = {
      winnerId,
      method: chosenMethod,
      proMethod: isPro ? chosenMethod : undefined,
      round: round ? Number(round) : null,
      knockdownsA: Number.isFinite(Number(knockdownsA)) ? Math.max(0, Math.round(Number(knockdownsA))) : 0,
      knockdownsB: Number.isFinite(Number(knockdownsB)) ? Math.max(0, Math.round(Number(knockdownsB))) : 0,
      titleChanged: Boolean(titleChanged),
      scorecards: Array.isArray(scorecards)
        ? scorecards.map((s) => ({
            judgeName: String(s.judgeName || '').trim() || 'Judge',
            judgeId: s.judgeId || null,
            boxerAScore: s.boxerAScore != null ? Number(s.boxerAScore) : null,
            boxerBScore: s.boxerBScore != null ? Number(s.boxerBScore) : null,
            boxerARounds: Array.isArray(s.boxerARounds) ? s.boxerARounds.map((r) => (r != null ? Number(r) : null)) : [],
            boxerBRounds: Array.isArray(s.boxerBRounds) ? s.boxerBRounds.map((r) => (r != null ? Number(r) : null)) : [],
          }))
        : [],
      notes: notes || '',
      recordedBy: user._id,
      recordedAt: new Date(),
    }

    // Update registration statuses: winner advances, loser eliminated or completed
    await Registration.updateOne({ _id: winnerId }, { $set: { status: 'completed' } })
    if (loserId) {
      await Registration.updateOne({ _id: loserId }, { $set: { status: bout.parentBoutId ? 'eliminated' : 'completed' } })
    }

    await bout.save()

    // --- Professional career record auto-update ---
    if (isPro) {
      await updateProRecords(bout, winnerId, loserId, chosenMethod, round, evt)
    }

    // Advance winner to parent bout (amateur brackets)
    if (bout.parentBoutId) {
      await advanceWinnerToParent(bout.parentBoutId, winnerId, bout.feedSide)
    }

    // Re-fetch with populated data
    const fresh = await Bout.findById(id)
      .populate({ path: 'boxerAId', populate: { path: 'boxerId' } })
      .populate({ path: 'boxerBId', populate: { path: 'boxerId' } })
      .populate({ path: 'winnerId', populate: { path: 'boxerId' } })
      .lean()

    return success({ bout: fresh, isPro })
  } catch (err) {
    return errorResponse(err)
  }
}

async function updateProRecords(bout, winnerId, loserId, method, round, evt) {
  const Boxer = (await import('./_shared/models/Boxer.js')).default

  const winnerReg = await Registration.findById(winnerId).populate('boxerId').lean()
  const loserReg = loserId ? await Registration.findById(loserId).populate('boxerId').lean() : null

  const winnerBoxer = winnerReg?.boxerId
  const loserBoxer = loserReg?.boxerId

  const proMethod = bout.result.proMethod || method
  const finishedByKO = /^KO|TKO|RTD|DQ$/i.test(proMethod)
  const noContest = /^no contest|technical draw$/i.test(proMethod)
  const roundsBoxed = Number.isFinite(Number(round)) && round > 0 ? Math.round(Number(round)) : null

  const updateBoxer = async (boxer, delta) => {
    if (!boxer || boxer.boxerType !== 'professional') return
    const rec = { ...(boxer.professional?.record || {}) }
    rec.wins = Number(rec.wins || 0) + (delta.wins || 0)
    rec.losses = Number(rec.losses || 0) + (delta.losses || 0)
    rec.draws = Number(rec.draws || 0) + (delta.draws || 0)
    rec.noContests = Number(rec.noContests || 0) + (delta.noContests || 0)
    rec.koWins = Number(rec.koWins || 0) + (delta.koWins || 0)
    if (roundsBoxed) rec.roundsBoxed = Number(rec.roundsBoxed || 0) + roundsBoxed
    if (delta.result) {
      rec.lastFive = [
        {
          result: delta.result,
          opponent: delta.opponent || '',
          date: new Date(),
          method: proMethod,
          rounds: roundsBoxed,
        },
        ...(rec.lastFive || []).slice(0, 4),
      ]
    }
    await Boxer.updateOne({ _id: boxer._id }, { $set: { 'professional.record': rec } })
  }

  if (winnerBoxer) {
    await updateBoxer(winnerBoxer, {
      wins: 1,
      koWins: finishedByKO ? 1 : 0,
      result: 'Win',
      opponent: loserBoxer ? loserBoxer.fullName : 'Opponent',
    })
  }
  if (loserBoxer) {
    await updateBoxer(loserBoxer, {
      losses: 1,
      result: 'Loss',
      opponent: winnerBoxer ? winnerBoxer.fullName : 'Opponent',
    })
  }

  // Title change bookkeeping on the event/pro block
  if (bout.result.titleChanged && winnerBoxer && loserBoxer && evt?.pro) {
    const Event = (await import('./_shared/models/Event.js')).default
    const titleName = bout.result.titleName || (evt.pro && evt.pro.sanctioningBody ? `${evt.pro.sanctioningBody} Championship` : 'Championship')
    // Mark winner's titles current, loser's lost in this division
    await Boxer.updateOne(
      { _id: winnerBoxer._id, 'professional.titles.division': bout.division || '' },
      { $set: { 'professional.titles.$.current': true, 'professional.titles.$.wonDate': new Date() } }
    )
    if (loserBoxer) {
      await Boxer.updateOne(
        { _id: loserBoxer._id, 'professional.titles.division': bout.division || '' },
        { $set: { 'professional.titles.$.current': false, 'professional.titles.$.lostDate': new Date() } }
      )
    }
  }
}

async function advanceWinnerToParent(parentBoutId, winnerId, feedSide) {
  const Bout = (await import('./_shared/models/Bout.js')).default
  const parent = await Bout.findById(parentBoutId)
  if (!parent) return

  const update =
    feedSide === 'A'
      ? { boxerAId: winnerId, status: parent.boxerBId ? 'scheduled' : 'ready' }
      : { boxerBId: winnerId, status: parent.boxerAId ? 'scheduled' : 'ready' }

  await Bout.updateOne({ _id: parent._id }, { $set: update })

  return parent
}
