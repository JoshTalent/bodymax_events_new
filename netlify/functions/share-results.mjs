import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import { requireAuth, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'
import { getTransport, getFrom, getReplyTo } from './_shared/mailer.js'

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

    const body = JSON.parse(event.body || '{}')
    const { email, eventId, fileName, pdfBase64, message } = body

    const target = String(email || '').trim().toLowerCase()
    if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      return errorResponse({ message: 'A valid recipient email is required', status: 400 })
    }
    if (!pdfBase64) {
      return errorResponse({ message: 'PDF content is missing', status: 400 })
    }

    await connectDB()
    const ev = eventId ? await Event.findById(eventId).select('name').lean() : null
    const eventName = ev?.name || 'Event'
    const safeName = (eventName).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'results'
    const attachmentName = fileName || `results-${safeName}.pdf`

    const clean = String(pdfBase64).replace(/^data:application\/pdf;[^,]*base64,/, '')

    const compactMessage = String(message || '')
      .trim()
      .slice(0, 2000)

    const text = [
      `Hello,`,
      '',
      compactMessage || `Please find attached the official ${eventName} results.`,
      '',
      'Regards,',
      `${user.name || 'Bodymax'} · Bodymax Events`,
    ].join('\n')

    const transporter = getTransport()
    const from = getFrom()
    const replyTo = getReplyTo()

    try {
      await transporter.sendMail({
        from,
        to: [target, replyTo].filter(Boolean),
        replyTo,
        subject: `Official Results — ${eventName}`,
        text,
        attachments: [
          {
            filename: attachmentName,
            content: Buffer.from(clean, 'base64'),
            contentType: 'application/pdf',
          },
        ],
      })
    } catch (err) {
      return errorResponse({
        message: `Email failed to send: ${err.message}`,
        status: 502,
      })
    }

    return success({ ok: true, to: target, fileName: attachmentName })
  } catch (err) {
    return errorResponse(err)
  }
}