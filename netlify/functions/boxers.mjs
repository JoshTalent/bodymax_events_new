import mongoose from 'mongoose'
import { connectDB } from './_shared/db.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
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

        // Cascade: permanently remove the boxer from every part of the system —
        // registrations, draws (bouts), weigh-ins (stored on registrations), results.
        const regs = await Registration.find({ boxerId: id }).select('_id').lean()
        const regIds = regs.map((r) => r._id)
        const inRegs = (v) => v && regIds.some((rid) => String(rid) === String(v))

        if (regIds.length) {
          // Pull the boxer out of any bout slots and award a walkover to the opponent.
          const bouts = await Bout.find({
            $or: [{ boxerAId: { $in: regIds } }, { boxerBId: { $in: regIds } }],
          })
          for (const bout of bouts) {
            if (inRegs(bout.boxerAId)) {
              bout.boxerAId = null
              if (bout.boxerBId) {
                bout.winnerId = bout.boxerBId
                bout.loserId = null
                bout.status = 'walkover'
                bout.result = {
                  winnerId: bout.boxerBId,
                  method: 'Walkover',
                  round: null,
                  notes: 'Boxer removed from system',
                  recordedAt: new Date(),
                }
                await Registration.updateOne({ _id: bout.boxerBId }, { $set: { status: 'completed' } })
              }
              await bout.save()
              continue
            }
            if (inRegs(bout.boxerBId)) {
              bout.boxerBId = null
              if (bout.boxerAId) {
                bout.winnerId = bout.boxerAId
                bout.loserId = null
                bout.status = 'walkover'
                bout.result = {
                  winnerId: bout.boxerAId,
                  method: 'Walkover',
                  round: null,
                  notes: 'Boxer removed from system',
                  recordedAt: new Date(),
                }
                await Registration.updateOne({ _id: bout.boxerAId }, { $set: { status: 'completed' } })
              }
              await bout.save()
            }
          }

          // Delete bouts that ended up with no boxers on either side.
          await Bout.deleteMany({ boxerAId: null, boxerBId: null, _id: { $in: bouts.map((b) => b._id) } })

          // Clear recorded winner/loser references in any remaining bout.
          await Bout.updateMany({ winnerId: { $in: regIds } }, { $set: { winnerId: null } })
          await Bout.updateMany({ loserId: { $in: regIds } }, { $set: { loserId: null } })
          await Bout.updateMany({ 'result.winnerId': { $in: regIds } }, { $set: { 'result.winnerId': null } })

          // Delete the boxer's registrations (weigh-ins live on these docs).
          await Registration.deleteMany({ boxerId: id })
        }

        await boxer.deleteOne()
        return success({ message: 'Boxer removed permanently', removed: regIds.length })
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
