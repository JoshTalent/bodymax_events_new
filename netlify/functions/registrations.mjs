import { connectDB } from './_shared/db.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import Event from './_shared/models/Event.js'
import Club from './_shared/models/Club.js'
import Bout from './_shared/models/Bout.js'
import { requireAuth, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()
    const user = await requireAuth(event)

    const params = event.queryStringParameters || {}
    const { eventId, clubId, status, id } = params
    const method = event.httpMethod

    if (method === 'OPTIONS') return success({})

    if (method === 'GET') {
      if (id) {
        const reg = await Registration.findById(id)
          .populate('boxerId')
          .lean()
        if (!reg) return errorResponse({ message: 'Registration not found', status: 404 })
        return success({ registration: reg })
      }

      let query = {}
      if (eventId) query.eventId = eventId
      if (status) query.status = status

      const regs = await Registration.find(query)
        .populate('boxerId')
        .populate('eventId', 'name eventDate')
        .sort({ createdAt: -1 })
        .lean()
      return success({ registrations: regs })
    }

    if (method === 'POST') {
      if (user.role !== 'club' && user.role !== 'promoter') {
        return errorResponse({ message: 'Only clubs or the event manager can enter boxers', status: 403 })
      }
      const body = JSON.parse(event.body || '{}')
      const { eventId: evId, boxerId, category } = body

      if (!evId || !boxerId) {
        return errorResponse({ message: 'eventId and boxerId are required', status: 400 })
      }

      const ev = await Event.findById(evId)
      if (!ev) return errorResponse({ message: 'Event not found', status: 404 })

      const boxer = await Boxer.findById(boxerId)
      if (!boxer) return errorResponse({ message: 'Boxer not found', status: 404 })

      // Clubs can only enter their own boxers. The promoter can enter any boxer
      // that belongs to a club assigned to this event.
      if (user.role === 'club') {
        if (!ev.registrationOpen) {
          return errorResponse({ message: 'Registration is not open for this event', status: 400 })
        }
        if (String(boxer.clubId) !== String(user.clubId)) {
          return errorResponse({ message: 'You can only register your own boxers', status: 403 })
        }
      } else {
        if (!boxer.clubId) {
          return errorResponse({ message: 'Assign the boxer to a club before entering them', status: 400 })
        }
        const clubAssigned = (ev.clubIds || []).some((cid) => String(cid) === String(boxer.clubId))
        if (!clubAssigned) {
          return errorResponse({ message: "Assign the boxer's club to this event first", status: 400 })
        }
      }

      const existing = await Registration.findOne({ eventId: evId, boxerId })
      if (existing) {
        return errorResponse({ message: 'This boxer is already registered for this event', status: 400 })
      }

      const cat = category || {}
      const eventWeights = ev.weightCategories || []
      const eventAges = ev.ageCategories || []

      if (eventWeights.length && cat.weight && !eventWeights.includes(cat.weight)) {
        return errorResponse({ message: 'Select a valid weight category for this event', status: 400 })
      }
      if (eventAges.length && cat.age && !eventAges.includes(cat.age)) {
        return errorResponse({ message: 'Select a valid age category for this event', status: 400 })
      }

      const gender = cat.gender || boxer.gender || 'M'
      const allowedGenders = ev.genderCategories?.length ? ev.genderCategories : ['M', 'F', 'Mixed']
      if (!allowedGenders.includes(gender)) {
        return errorResponse({ message: 'Select a valid gender category for this event', status: 400 })
      }

      let clubName = body.clubName || boxer.clubName || ''
      if (boxer.clubId) {
        const boxerClub = await Club.findById(boxer.clubId).lean()
        if (boxerClub) clubName = boxerClub.name
      }

      const reg = await Registration.create({
        eventId: evId,
        clubName,
        whatsapp: body.whatsapp || '',
        email: body.email || '',
        numberOfBouts: Number(body.numberOfBouts) || 1,
        boxerId,
        category: {
          weight: cat.weight || boxer.weightCategory || '',
          age: cat.age || boxer.ageCategory || '',
          gender,
        },
        status: user.role === 'promoter' ? 'approved' : 'pending_approval',
      })
      return success({ registration: reg }, 201)
    }

    if (method === 'DELETE') {
      if (user.role !== 'promoter') {
        return errorResponse({ message: 'Only the event manager can remove an entry', status: 403 })
      }
      if (!id) return errorResponse({ message: 'Registration id is required', status: 400 })
      const reg = await Registration.findById(id)
      if (!reg) return errorResponse({ message: 'Registration not found', status: 404 })

      // Remove any bouts that used this entry so the draw stays consistent.
      await Bout.deleteMany({ $or: [{ boxerAId: reg._id }, { boxerBId: reg._id }] })
      await reg.deleteOne()
      return success({ message: 'Boxer removed from event' })
    }

    return errorResponse({ message: 'Method not allowed', status: 405 })
  } catch (err) {
    return errorResponse(err)
  }
}
