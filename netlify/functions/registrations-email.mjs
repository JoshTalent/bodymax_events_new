import nodemailer from 'nodemailer'
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

    const user = process.env.GMAIL_USER
    const appPassword = process.env.GMAIL_APP_PASSWORD
    if (!user || !appPassword) {
      return errorResponse({
        message: 'Email sending is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD on Netlify.',
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
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: appPassword },
    })

    try {
      await transporter.sendMail({
        from: `"Bodymax Events" <${user}>`,
        to: [reg.email, user],
        replyTo: user,
        subject,
        text: thankYouMessage(reg),
      })
    } catch (err) {
      return errorResponse({
        message: `Email failed to send: ${err.message}`,
        status: 502,
      })
    }

    return success({ ok: true, to: reg.email })
  } catch (err) {
    return errorResponse(err)
  }
}