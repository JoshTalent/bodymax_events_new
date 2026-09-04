import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { connectDB } from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET

export function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export async function verifyToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET)
  await connectDB()
  const user = await User.findById(decoded.id).lean()
  return user
}

export async function requireAuth(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Not authenticated')
    error.status = 401
    throw error
  }
  const token = authHeader.split(' ')[1]
  try {
    const user = await verifyToken(token)
    if (!user || !user.active) {
      const e = new Error('User not found or inactive')
      e.status = 401
      throw e
    }
    return user
  } catch (err) {
    if (err.status) throw err
    const e = new Error('Invalid or expired token')
    e.status = 401
    throw e
  }
}

export function requireRole(...roles) {
  return async (event) => {
    const user = await requireAuth(event)
    if (!roles.includes(user.role)) {
      const error = new Error('You do not have permission to perform this action')
      error.status = 403
      throw error
    }
    return user
  }
}

export function success(data, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(data),
  }
}

export function errorResponse(err) {
  return {
    statusCode: err.status || 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ message: err.message || 'Internal server error' }),
  }
}
