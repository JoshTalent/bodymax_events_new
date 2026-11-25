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
    if (body.photoUrl !== undefined) {
      const photoUrl = String(body.photoUrl || '').trim()
      if (photoUrl.length > 2048) {
        return errorResponse({ message: 'Photo link is too long', status: 400 })
      }
      if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
        return errorResponse({ message: 'Enter a valid image link starting with http:// or https://', status: 400 })
      }
      updates.photoUrl = photoUrl
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
      const bouts = Number.isFinite(Number(body.numberOfBouts)) && String(body.numberOfBouts ?? '').trim() !== ''
        ? Math.max(0, Math.trunc(Number(body.numberOfBouts)))
        : 1
      updates.numberOfBouts = bouts
      regUpdates.numberOfBouts = bouts
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
