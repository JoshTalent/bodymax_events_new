import { connectDB } from './_shared/db.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import Event from './_shared/models/Event.js'
import Club from './_shared/models/Club.js'
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
      if (user.role !== 'club') {
        return errorResponse({ message: 'Only clubs can register boxers', status: 403 })
      }
      const body = JSON.parse(event.body || '{}')
      const { eventId: evId, boxerId, category } = body

      if (!evId || !boxerId) {
        return errorResponse({ message: 'eventId and boxerId are required', status: 400 })
      }

      const ev = await Event.findById(evId)
      if (!ev) return errorResponse({ message: 'Event not found', status: 404 })
      if (!ev.registrationOpen) {
        return errorResponse({ message: 'Registration is not open for this event', status: 400 })
      }

      const boxer = await Boxer.findById(boxerId)
      if (!boxer) return errorResponse({ message: 'Boxer not found', status: 404 })
      if (String(boxer.clubId) !== String(user.clubId)) {
        return errorResponse({ message: 'You can only register your own boxers', status: 403 })
      }

      const existing = await Registration.findOne({ eventId: evId, boxerId })
      if (existing) {
        return errorResponse({ message: 'This boxer is already registered for this event', status: 400 })
      }

      const cat = category || {}
      const eventWeights = ev.weightCategories || []
      const eventAges = ev.ageCategories || []

      if (eventWeights.length && !eventWeights.includes(cat.weight)) {
        return errorResponse({ message: 'Select a valid weight category for this event', status: 400 })
      }
      if (eventAges.length && !eventAges.includes(cat.age)) {
        return errorResponse({ message: 'Select a valid age category for this event', status: 400 })
      }

      const gender = cat.gender || boxer.gender || 'M'
      const allowedGenders = ev.genderCategories?.length ? ev.genderCategories : ['M', 'F', 'Mixed']
      if (!allowedGenders.includes(gender)) {
        return errorResponse({ message: 'Select a valid gender category for this event', status: 400 })
      }

      const reg = await Registration.create({
        eventId: evId,
        clubId: user.clubId,
        clubName: body.clubName || '',
        numberOfBouts: Number(body.numberOfBouts) || 1,
        boxerId,
        category: {
          weight: cat.weight || '',
          age: cat.age || '',
          gender,
        },
        status: 'pending_approval',
      })
      return success({ registration: reg }, 201)
    }

    return errorResponse({ message: 'Method not allowed', status: 405 })
  } catch (err) {
    return errorResponse(err)
  }
}
