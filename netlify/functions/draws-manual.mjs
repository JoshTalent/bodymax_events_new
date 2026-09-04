import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Club from './_shared/models/Club.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

const ELIGIBLE = { $in: ['approved', 'eligible', 'payment_confirmed', 'weighed', 'completed'] }

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const params = event.queryStringParameters || {}
    const { eventId } = params
    if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })

    const body = JSON.parse(event.body || '{}')
    const { weight = '', age = '', gender = '', bouts } = body
    if (!Array.isArray(bouts) || bouts.length === 0) {
      return errorResponse({ message: 'Provide at least one pairing (bouts)', status: 400 })
    }

    await connectDB()

    const ev = await Event.findById(eventId)
    if (!ev) return errorResponse({ message: 'Event not found', status: 404 })

    const category = { weight, age, gender }

    const usedIds = bouts.flatMap((p) => [p.boxerAId, p.boxerBId]).filter(Boolean)
    if (usedIds.length === 0) {
      return errorResponse({ message: 'Select at least one boxer in the pairings', status: 400 })
    }

    const catFilter = {}
    if (weight) catFilter['category.weight'] = weight
    if (age) catFilter['category.age'] = age
    if (gender) catFilter['category.gender'] = gender

    const valid = await Registration.find({
      _id: { $in: usedIds },
      eventId,
      status: ELIGIBLE,
      ...catFilter,
    }).lean()

    const validSet = new Set(valid.map((r) => String(r._id)))

    // Boxers already placed in this event's draw keep their slots when re-saving
    const existing = await Bout.find({ eventId }).select('boxerAId boxerBId').lean()
    const existingIds = new Set(
      existing.flatMap((b) => [b.boxerAId, b.boxerBId]).filter(Boolean).map((x) => String(x))
    )

    for (const pid of usedIds) {
      if (!validSet.has(String(pid)) && !existingIds.has(String(pid))) {
        return errorResponse({ message: 'One of the selected boxers is not eligible for this category', status: 400 })
      }
    }

    // Remove existing drawn bouts for this event/category (allow re-making the draw)
    await Bout.deleteMany({
      eventId,
      'category.weight': weight,
      'category.age': age,
      'category.gender': gender,
    })

    // Create a flat list of bouts for the event (single round, no bracket rounds)
    const saved = []
    let boutNumber = 1
    for (const p of bouts) {
      const a = p.boxerAId || null
      const b = p.boxerBId || null
      const bout = new Bout({
        eventId,
        category,
        round: 1,
        roundName: 'Bout',
        boutNumber: boutNumber++,
        bracketPosition: saved.length,
        boxerAId: a,
        boxerBId: b,
        status: a && b ? 'scheduled' : 'walkover',
      })
      if (!a || !b) {
        bout.winnerId = a || b || null
        bout.result = { winnerId: bout.winnerId, method: 'Walkover', recordedAt: new Date() }
      }
      saved.push(await bout.save())
    }

    const allBouts = await Bout.find({
      eventId,
      'category.weight': weight,
      'category.age': age,
      'category.gender': gender,
    })
      .sort({ boutNumber: 1 })
      .populate({
        path: 'boxerAId',
        populate: { path: 'boxerId' },
      })
      .populate({
        path: 'boxerBId',
        populate: { path: 'boxerId' },
      })
      .populate('winnerId')
      .lean()

    return success({ message: 'Manual draw created', bouts: allBouts, size: saved.length })
  } catch (err) {
    return errorResponse(err)
  }
}