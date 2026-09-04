import bcrypt from 'bcryptjs'
import { connectDB } from './_shared/db.js'
import User from './_shared/models/User.js'
import { signToken, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    if (event.httpMethod === 'OPTIONS') {
      return success({})
    }
    if (event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const { email, password } = JSON.parse(event.body || '{}')
    if (!email || !password) {
      return errorResponse({ message: 'Email and password are required', status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return errorResponse({ message: 'Invalid credentials', status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return errorResponse({ message: 'Invalid credentials', status: 401 })
    }

    if (!user.active) {
      return errorResponse({ message: 'Account is disabled', status: 403 })
    }

    const token = signToken(user)
    return success({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clubId: user.clubId,
        officialRole: user.officialRole,
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
