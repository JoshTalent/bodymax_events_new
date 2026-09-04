import { connectDB } from './_shared/db.js'
import Club from './_shared/models/Club.js'
import Boxer from './_shared/models/Boxer.js'
import User from './_shared/models/User.js'
import { requireAuth, requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()

    const params = event.queryStringParameters || {}
    const { clubId: requested, populate } = params

    const user = await requireAuth(event)

    if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH' || event.httpMethod === 'DELETE') {
      const promoter = await requireRole('promoter')(event)
      const id = requested || params.id
      if (!id) {
        return errorResponse({ message: 'Club id is required', status: 400 })
      }
      const club = await Club.findById(id)
      if (!club) {
        return errorResponse({ message: 'Club not found', status: 404 })
      }

      if (event.httpMethod === 'DELETE') {
        await Boxer.deleteMany({ clubId: club._id })
        await User.deleteMany({ clubId: club._id, role: 'club' })
        await club.deleteOne()
        return success({ message: 'Club deleted' })
      }

      const body = JSON.parse(event.body || '{}')
      const updates = {}
      const allowed = ['name', 'contactName', 'contactEmail', 'contactPhone', 'address', 'logoUrl', 'active']
      for (const key of allowed) {
        if (body[key] !== undefined) {
          updates[key] = body[key]
        }
      }
      if (body.contactEmail) {
        const existing = await User.findOne({ email: body.contactEmail.toLowerCase() })
        if (existing && String(existing.clubId) !== String(club._id)) {
          return errorResponse({ message: 'A user with this email already exists', status: 400 })
        }
      }
      Object.assign(club, updates)
      await club.save()
      return success({ message: 'Club updated', club: club.toObject() })
    }

    if (user.role === 'club') {
      if (requested && requested !== String(user.clubId)) {
        return errorResponse({ message: 'Forbidden', status: 403 })
      }
      const club = await Club.findById(user.clubId).lean()
      if (!club) {
        return errorResponse({ message: 'Club not found', status: 404 })
      }
      const boxers = await Boxer.find({ clubId: club._id }).lean()
      return success({ club, boxers })
    }

    if (user.role === 'promoter') {
      const query = requested ? { _id: requested } : {}
      const clubs = requested ? [await Club.findById(requested).lean()] : await Club.find().lean()

      const withBoxers = populate === 'true'
      let result = clubs
      if (withBoxers && requested) {
        const boxers = await Boxer.find({ clubId: requested }).lean()
        return success({ club: clubs[0], boxers })
      }
      for (const c of result) {
        c.boxerCount = await Boxer.countDocuments({ clubId: c._id })
      }
      return success(requested ? { club: result[0] } : { clubs: result })
    }

    return errorResponse({ message: 'Forbidden', status: 403 })
  } catch (err) {
    return errorResponse(err)
  }
}