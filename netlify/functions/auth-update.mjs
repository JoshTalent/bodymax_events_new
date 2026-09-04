import bcrypt from 'bcryptjs'
import { connectDB } from './_shared/db.js'
import User from './_shared/models/User.js'
import { requireAuth, signToken, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    const user = await requireAuth(event)
    await connectDB()

    if (event.httpMethod === 'OPTIONS') {
      return success({})
    }

    if (event.httpMethod !== 'POST' && event.httpMethod !== 'PATCH' && event.httpMethod !== 'PUT') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const body = JSON.parse(event.body || '{}')
    const fresh = await User.findById(user._id)

    if (!fresh) {
      return errorResponse({ message: 'User not found', status: 404 })
    }

    if (body.action === 'change_password') {
      const { currentPassword, newPassword } = body
      if (!currentPassword || !newPassword) {
        return errorResponse({ message: 'Current and new password are required', status: 400 })
      }
      if (newPassword.length < 6) {
        return errorResponse({ message: 'New password must be at least 6 characters', status: 400 })
      }
      const valid = await bcrypt.compare(currentPassword, fresh.passwordHash)
      if (!valid) {
        return errorResponse({ message: 'Current password is incorrect', status: 400 })
      }
      fresh.passwordHash = await bcrypt.hash(newPassword, 10)
      await fresh.save()
      return success({ message: 'Password updated' })
    }

    const { name, email } = body

    if (email && email.toLowerCase() !== fresh.email) {
      const existing = await User.findOne({ email: email.toLowerCase() })
      if (existing) {
        return errorResponse({ message: 'A user with this email already exists', status: 400 })
      }
    }

    if (name) fresh.name = name
    if (email) fresh.email = email.toLowerCase()
    await fresh.save()

    const token = signToken(fresh.toObject())

    return success({
      message: 'Profile updated',
      token,
      user: {
        id: fresh._id,
        name: fresh.name,
        email: fresh.email,
        role: fresh.role,
        clubId: fresh.clubId,
        officialRole: fresh.officialRole,
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
