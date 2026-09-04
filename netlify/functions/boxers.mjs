import mongoose from 'mongoose'
import { connectDB } from './_shared/db.js'
import Boxer from './_shared/models/Boxer.js'
import Club from './_shared/models/Club.js'
import { requireAuth, requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()
    const user = await requireAuth(event)

    const params = event.queryStringParameters || {}
    const { id, clubId } = params
    const method = event.httpMethod

    if (method === 'OPTIONS') {
      return success({})
    }

    // List boxers
    if (method === 'GET') {
      let query = {}
      if (user.role === 'club') {
        query = { clubId: user.clubId }
      } else if (user.role === 'promoter') {
        if (clubId) query = { clubId }
      } else {
        return errorResponse({ message: 'Forbidden', status: 403 })
      }
      const boxers = await Boxer.find(query).sort({ fullName: 1 }).lean()
      return success({ boxers })
    }

    // Single boxer
    if (id) {
      if (method === 'GET') {
        const boxer = await Boxer.findById(id).lean()
        if (!boxer) return errorResponse({ message: 'Boxer not found', status: 404 })
        if (user.role === 'club' && String(boxer.clubId) !== String(user.clubId)) {
          return errorResponse({ message: 'Forbidden', status: 403 })
        }
        return success({ boxer })
      }
      if (method === 'PUT' || method === 'PATCH') {
        const boxer = await Boxer.findById(id)
        if (!boxer) return errorResponse({ message: 'Boxer not found', status: 404 })
        if (user.role === 'club' && String(boxer.clubId) !== String(user.clubId)) {
          return errorResponse({ message: 'Forbidden', status: 403 })
        }
        const body = JSON.parse(event.body || '{}')
        Object.assign(boxer, body)
        await boxer.save()
        return success({ boxer })
      }
      if (method === 'DELETE') {
        if (user.role !== 'club' && user.role !== 'promoter') {
          return errorResponse({ message: 'Forbidden', status: 403 })
        }
        const boxer = await Boxer.findById(id)
        if (!boxer) return errorResponse({ message: 'Boxer not found', status: 404 })
        if (user.role === 'club' && String(boxer.clubId) !== String(user.clubId)) {
          return errorResponse({ message: 'Forbidden', status: 403 })
        }
        await boxer.deleteOne()
        return success({ message: 'Boxer deleted' })
      }
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    // Create boxer
    if (method === 'POST') {
      const roleUser = await requireRole('club', 'promoter')(event)
      // club can only create for itself; promoter can leave a boxer unaffiliated
      let body = JSON.parse(event.body || '{}')
      let effectiveClubId = body.clubId || null
      if (user.role === 'club') {
        effectiveClubId = user.clubId
        const club = await Club.findById(user.clubId)
        if (!club) return errorResponse({ message: 'Club not found', status: 404 })
      }

      if (!body.fullName) return errorResponse({ message: 'Boxer full name required', status: 400 })

      const boxer = await Boxer.create({ ...body, clubId: effectiveClubId })
      return success({ boxer }, 201)
    }

    return errorResponse({ message: 'Method not allowed', status: 405 })
  } catch (err) {
    return errorResponse(err)
  }
}
