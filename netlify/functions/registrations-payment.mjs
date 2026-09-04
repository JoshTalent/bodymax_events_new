import { connectDB } from './_shared/db.js'
import Registration from './_shared/models/Registration.js'
import { requireAuth, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    const user = await requireAuth(event)

    if (event.httpMethod === 'OPTIONS') return success({})
    if (event.httpMethod !== 'PUT' && event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const params = event.queryStringParameters || {}
    const { id } = params
    if (!id) return errorResponse({ message: 'Registration id required', status: 400 })

    const body = JSON.parse(event.body || '{}')
    const { amount, method, reference, paidAt, proofUrl } = body

    if (!amount || !method || !reference) {
      return errorResponse({ message: 'Amount, method and reference are required', status: 400 })
    }

    await connectDB()
    const reg = await Registration.findById(id)
    if (!reg) return errorResponse({ message: 'Registration not found', status: 404 })

    // Only the owning club can submit payment (or promoter)
    if (user.role === 'club' && String(reg.clubId) !== String(user.clubId)) {
      return errorResponse({ message: 'Forbidden', status: 403 })
    }

    // Status should be pending or needs a payment
    if (reg.payment?.status === 'confirmed') {
      return errorResponse({ message: 'Payment already confirmed', status: 400 })
    }

    reg.payment = {
      ...reg.payment,
      status: 'submitted',
      amount: Number(amount),
      method,
      reference,
      paidAt: paidAt || new Date(),
      proofUrl: proofUrl || '',
      submittedAt: new Date(),
      feedback: '',
    }
    if (reg.status === 'approved' || reg.status === 'payment_pending') {
      reg.status = 'payment_pending'
    }

    await reg.save()
    return success({ registration: reg })
  } catch (err) {
    return errorResponse(err)
  }
}
