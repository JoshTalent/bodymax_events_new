import bcrypt from 'bcryptjs'
import { connectDB } from './_shared/db.js'
import User from './_shared/models/User.js'
import { requireRole, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

function safe(u) {
  return { id: u._id, name: u.name, email: u.email, role: u.role, canManageUsers: u.canManageUsers !== false }
}

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    const owner = await requireRole('promoter')(event)
    if (owner.canManageUsers === false) {
      return errorResponse({ message: 'You do not have permission to manage users', status: 403 })
    }
    await connectDB()

    if (event.httpMethod === 'OPTIONS') return success({})

    if (event.httpMethod === 'GET') {
      const users = await User.find({ role: 'promoter' }).sort({ createdAt: 1 }).lean()
      return success({ users })
    }

    if (event.httpMethod === 'DELETE') {
      const id = (event.queryStringParameters || {}).id
      if (!id) return errorResponse({ message: 'User id is required', status: 400 })
      if (String(id) === String(owner._id)) {
        return errorResponse({ message: 'You cannot delete your own account', status: 400 })
      }
      const user = await User.findById(id)
      if (!user) return errorResponse({ message: 'User not found', status: 404 })
      if (user.role !== 'promoter' || user.canManageUsers !== false) {
        return errorResponse({ message: 'This user cannot be deleted', status: 400 })
      }
      await user.deleteOne()
      return success({ message: 'User deleted' })
    }

    if (event.httpMethod === 'POST') {
      const { name, email, password } = JSON.parse(event.body || '{}')
      if (!name || !email || !password) {
        return errorResponse({ message: 'Name, email and password are required', status: 400 })
      }
      if (password.length < 6) {
        return errorResponse({ message: 'Password must be at least 6 characters', status: 400 })
      }
      const cleanEmail = email.toLowerCase().trim()
      const existing = await User.findOne({ email: cleanEmail })
      if (existing) {
        return errorResponse({ message: 'A user with this email already exists', status: 400 })
      }
      const user = await User.create({
        name,
        email: cleanEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'promoter',
        canManageUsers: false,
      })
      return success({ message: 'User created', user: safe(user.toObject()) }, 201)
    }

    if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
      const id = (event.queryStringParameters || {}).id
      if (!id) return errorResponse({ message: 'User id is required', status: 400 })
      const { name, email, password } = JSON.parse(event.body || '{}')
      const user = await User.findById(id)
      if (!user) return errorResponse({ message: 'User not found', status: 404 })

      if (name) user.name = name
      if (email) {
        const cleanEmail = email.toLowerCase().trim()
        const existing = await User.findOne({ email: cleanEmail })
        if (existing && String(existing._id) !== String(user._id)) {
          return errorResponse({ message: 'A user with this email already exists', status: 400 })
        }
        user.email = cleanEmail
      }
      if (password) {
        if (password.length < 6) {
          return errorResponse({ message: 'Password must be at least 6 characters', status: 400 })
        }
        user.passwordHash = await bcrypt.hash(password, 10)
      }

      await user.save()
      return success({ message: 'User updated', user: safe(user.toObject()) })
    }

    return errorResponse({ message: 'Method not allowed', status: 405 })
  } catch (err) {
    return errorResponse(err)
  }
}