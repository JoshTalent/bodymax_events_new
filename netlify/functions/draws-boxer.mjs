import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'POST') return errorResponse({ message: 'Method not allowed', status: 405 })

    const params = event.queryStringParameters || {}
    const { eventId } = params
    if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })

    const body = JSON.parse(event.body || '{}')
    const { fullName, gender = '', weight = '', age = '' } = body
    if (!fullName || !fullName.trim()) {
      return errorResponse({ message: 'Boxer full name required', status: 400 })
    }

    await connectDB()

    const ev = await Event.findById(eventId)
    if (!ev) return errorResponse({ message: 'Event not found', status: 404 })

    const weightCategories = ev.weightCategories || []
    const ageCategories = ev.ageCategories || []
    if (weightCategories.length && weight && !weightCategories.includes(weight)) {
      return errorResponse({ message: `Select a valid weight category (${weightCategories.join(', ')})`, status: 400 })
    }
    if (ageCategories.length && age && !ageCategories.includes(age)) {
      return errorResponse({ message: `Select a valid age category (${ageCategories.join(', ')})`, status: 400 })
    }

    const cleanName = fullName.trim()

    let boxer = await Boxer.findOne({ fullName: new RegExp(`^${cleanName}$`, 'i'), clubId: null })
    if (!boxer) {
      boxer = await Boxer.create({
        clubId: null,
        fullName: cleanName,
        gender: gender || null,
        weightCategory: weight,
        ageCategory: age,
      })
    }

    let registration = await Registration.findOne({ eventId, boxerId: boxer._id })
    if (registration) {
      registration.category = {
        weight: weight || registration.category?.weight || '',
        age: age || registration.category?.age || '',
        gender: gender || registration.category?.gender || '',
      }
      registration.status = 'eligible'
      await registration.save()
    } else {
      registration = await Registration.create({
        eventId,
        clubName: body.clubName || '',
        numberOfBouts: Number(body.numberOfBouts) || 1,
        boxerId: boxer._id,
        category: { weight, age, gender },
        status: 'eligible',
      })
    }

    return success({ registration })
  } catch (err) {
    return errorResponse(err)
  }
}