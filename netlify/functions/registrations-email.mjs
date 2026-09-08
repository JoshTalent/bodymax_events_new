import { connectDB } from './_shared/db.js'
import Registration from './_shared/models/Registration.js'
import { requireAuth, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

function thankYouMessage(r) {
  const boxer = r.boxerId?.fullName || 'your boxer'
  const event = r.eventId?.name || 'our event'
  const date = r.eventId?.eventDate
    ? new Date(r.eventId.eventDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const gender = r.category?.gender === 'M' ? 'Male' : r.category?.gender === 'F' ? 'Female' : ''
  const cat = []
  if (r.category?.weight) cat.push(`Weight: ${r.category.weight}`)
  if (r.category?.age) cat.push(`Age: ${r.category.age}`)
  if (gender) cat.push(`Gender: ${gender}`)
  return [
    `Hello ${r.clubName || 'the club'},`,
    `Thank you for registering ${boxer} for ${event}${date ? ` on ${date}` : ''}.`,
    'Here are the details of the boxer added:',
    `• Name: ${boxer}`,
    ...cat.map((c) => `• ${c}`),
    `• Bouts: ${r.numberOfBouts || 1}`,
    'We will review and confirm the entry. Best regards, Bodymax Events Team',
  ].join('\n')
}

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    const user = await requireAuth(event)
    if (!['promoter', 'official'].includes(user.role)) {
      throw Object.assign(new Error('You do not have permission'), { status: 403 })
    }
    if (event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM
    if (!apiKey || !from) {
      return errorResponse({
        message: 'Email sending is not configured. Set RESEND_API_KEY and EMAIL_FROM on Netlify.',
        status: 500,
      })
    }

    await connectDB()
    const reg = await Registration.findById((JSON.parse(event.body || '{}').id || ''))
      .populate('boxerId')
      .populate('eventId', 'name eventDate')
      .lean()
    if (!reg) return errorResponse({ message: 'Registration not found', status: 404 })
    if (!reg.email) return errorResponse({ message: 'No club email on this registration', status: 400 })

    const subject = `Thank you for registering ${reg.boxerId?.fullName || 'your boxer'} for ${reg.eventId?.name || 'our event'}`
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: reg.email,
        subject,
        text: thankYouMessage(reg),
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      return errorResponse({ message: `Email failed to send: ${detail}`, status: 502 })
    }

    return success({ ok: true, to: reg.email })
  } catch (err) {
    return errorResponse(err)
  }
}