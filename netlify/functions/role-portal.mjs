import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Club from './_shared/models/Club.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
import RoleLink from './_shared/models/RoleLink.js'
import { success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()

    if (event.httpMethod !== 'GET') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const token = (event.queryStringParameters || {}).token
    if (!token) return errorResponse({ message: 'Token required', status: 400 })

    const link = await RoleLink.findOne({ token, active: true }).lean()
    if (!link) {
      return errorResponse({ message: 'This link is invalid or has been revoked', status: 404 })
    }

    await RoleLink.updateOne({ _id: link._id }, { lastUsedAt: new Date() })

    const evt = await Event.findById(link.eventId).lean()
    if (!evt) return errorResponse({ message: 'Event not found', status: 404 })

    const schedule = await Bout.find({ eventId: link.eventId, status: { $nin: ['cancelled'] } })
      .sort({ sortOrder: 1, boutNumber: 1 })
      .populate({ path: 'boxerAId', populate: { path: 'boxerId' } })
      .populate({ path: 'boxerBId', populate: { path: 'boxerId' } })
      .populate({ path: 'winnerId', populate: { path: 'boxerId' } })
      .lean()

    const payload = {
      role: link.role,
      event: {
        _id: evt._id,
        name: evt.name,
        venue: evt.venue,
        location: evt.location,
        eventDate: evt.eventDate,
        status: evt.status,
        description: evt.description,
        weightCategories: evt.weightCategories || [],
        ageCategories: evt.ageCategories || [],
      },
      schedule,
    }

    // Commentators get the full fighter card so they can present each boxer
    if (link.role === 'commentator') {
      const regs = await Registration.find({
        eventId: link.eventId,
        status: { $nin: ['registered', 'pending_approval', 'needs_correction', 'not_eligible', 'withdrawn'] },
      })
        .populate('boxerId')
        .sort({ createdAt: 1 })
        .lean()

      payload.boxers = regs.map((r) => ({
        _id: r._id,
        fullName: r.boxerId?.fullName || '',
        clubName: r.clubName || r.clubId?.name || null,
        gender: r.boxerId?.gender || r.category?.gender || null,
        weightCategory: r.category?.weight || r.boxerId?.weightCategory || '',
        ageCategory: r.category?.age || r.boxerId?.ageCategory || '',
        registeredWeightKg: r.boxerId?.registeredWeightKg ?? null,
        nationality: r.boxerId?.nationality || '',
        boxingRecord: r.boxerId?.boxingRecord || { wins: 0, losses: 0, draws: 0 },
        experience: r.boxerId?.experience || '',
        photoUrl: r.boxerId?.photoUrl || '',
        status: r.status,
      }))
    }

    // Officials and judges see the recorded results
    if (link.role === 'official' || link.role === 'judge') {
      payload.results = schedule.filter((b) => b.status === 'completed' && b.winnerId)
    }

    return success(payload)
  } catch (err) {
    return errorResponse(err)
  }
}