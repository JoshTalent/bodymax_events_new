import bcrypt from 'bcryptjs'
import { connectDB } from './_shared/db.js'
import User from './_shared/models/User.js'
import Club from './_shared/models/Club.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await requireRole('promoter')(event)

    if (event.httpMethod === 'OPTIONS') {
      return success({})
    }

    if (event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const body = JSON.parse(event.body || '{}')

    if (body.action === 'create_club_account') {
      const { clubName, name, email, password } = body

      if (!clubName || !name || !email || !password) {
        return errorResponse({ message: 'Club name, name, email and password are required', status: 400 })
      }
      if (password.length < 6) {
        return errorResponse({ message: 'Password must be at least 6 characters', status: 400 })
      }

      await connectDB()

      const existing = await User.findOne({ email: email.toLowerCase() })
      if (existing) {
        return errorResponse({ message: 'A user with this email already exists', status: 400 })
      }

      const club = await Club.create({ name: clubName, contactEmail: email })
      const passwordHash = await bcrypt.hash(password, 10)
      const user = await User.create({
        name,
        email,
        passwordHash,
        role: 'club',
        clubId: club._id,
      })

      return success(
        {
          message: 'Club account created',
          club,
          user: { id: user._id, name: user.name, email: user.email, role: user.role, clubId: user.clubId },
        },
        201
      )
    }

    return errorResponse({ message: 'Unknown action', status: 400 })
  } catch (err) {
    return errorResponse(err)
  }
}
