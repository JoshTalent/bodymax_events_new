import { connectDB } from './_shared/db.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
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
    const { registrationId } = params
    if (!registrationId) return errorResponse({ message: 'registrationId required', status: 400 })

    const body = JSON.parse(event.body || '{}')

    await connectDB()

    const reg = await Registration.findById(registrationId).populate('boxerId')
    if (!reg) return errorResponse({ message: 'Registration not found', status: 404 })
    if (!reg.boxerId) return errorResponse({ message: 'Boxer not found', status: 404 })

    const updates = {}
    const regUpdates = {}

    if (body.fullName !== undefined && body.fullName.trim()) {
      updates.fullName = body.fullName.trim()
    }
    if (body.clubName !== undefined) {
      updates.clubName = (body.clubName || '').trim()
      regUpdates.clubName = updates.clubName
    }
    if (body.gender !== undefined) {
      updates.gender = body.gender || null
      regUpdates['category.gender'] = body.gender || ''
    }
    if (body.weight !== undefined) {
      updates.weightCategory = body.weight || ''
      regUpdates['category.weight'] = body.weight || ''
    }
    if (body.age !== undefined) {
      updates.ageCategory = body.age || ''
      regUpdates['category.age'] = body.age || ''
    }
    if (body.numberOfBouts !== undefined) {
      updates.numberOfBouts = Number(body.numberOfBouts) || 1
      regUpdates.numberOfBouts = Number(body.numberOfBouts) || 1
    }

    if (Object.keys(updates).length) {
      await Boxer.updateOne({ _id: reg.boxerId._id }, { $set: updates })
    }
    if (Object.keys(regUpdates).length) {
      await Registration.updateOne({ _id: reg._id }, { $set: regUpdates })
    }

    const fresh = await Registration.findById(reg._id)
      .populate('boxerId')
      .lean()
    return success({ registration: fresh })
  } catch (err) {
    return errorResponse(err)
  }
}
