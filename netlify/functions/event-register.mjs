import nodemailer from 'nodemailer'
import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import { success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    if (event.httpMethod === 'OPTIONS') return success({})

    const token = (event.queryStringParameters || {}).token
    if (!token) return errorResponse({ message: 'Token required', status: 400 })

    await connectDB()

    const evt = await Event.findOne({ registrationToken: token }).lean()
    if (!evt) return errorResponse({ message: 'This registration link is invalid or has been removed', status: 404 })

    const eventInfo = {
      _id: evt._id,
      name: evt.name,
      description: evt.description,
      venue: evt.venue,
      location: evt.location,
      eventDate: evt.eventDate,
      registrationDeadline: evt.registrationDeadline,
      registrationOpen: evt.registrationOpen,
      status: evt.status,
      weightCategories: evt.weightCategories || [],
      ageCategories: evt.ageCategories || [],
      requirements: evt.registrationRequirements || '',
      rules: evt.rules || '',
    }

    if (event.httpMethod === 'GET') {
      return success({ event: eventInfo })
    }

    if (event.httpMethod !== 'POST') {
      return errorResponse({ message: 'Method not allowed', status: 405 })
    }

    if (!evt.registrationOpen || evt.status === 'closed' || evt.status === 'completed' || evt.status === 'archived') {
      return errorResponse({ message: 'Registration is closed for this event', status: 400 })
    }

    if (evt.registrationDeadline && new Date(evt.registrationDeadline) < new Date()) {
      return errorResponse({ message: 'Registration has closed for this event', status: 400 })
    }

    const body = JSON.parse(event.body || '{}')
    const { boxers = [], clubName = '', whatsapp = '', email = '' } = body

    if (!Array.isArray(boxers) || boxers.length === 0) {
      return errorResponse({ message: 'Add at least one boxer to register', status: 400 })
    }

    const cleanWhatsapp = whatsapp.trim()
    if (!cleanWhatsapp) {
      return errorResponse({ message: 'Club WhatsApp number is required', status: 400 })
    }
    if (!/^\+?[\d\s()-]{7,18}$/.test(cleanWhatsapp)) {
      return errorResponse({ message: 'Enter a valid WhatsApp number', status: 400 })
    }
    const normalizedWhatsapp = (() => {
      const d = cleanWhatsapp.replace(/[^0-9]/g, '')
      if (d.startsWith('250')) return d
      if (d.startsWith('0')) return '250' + d.slice(1)
      if (d.startsWith('7')) return '250' + d
      return d
    })()

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      return errorResponse({ message: 'Club email is required', status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return errorResponse({ message: 'Enter a valid email address', status: 400 })
    }

    const weightCategories = evt.weightCategories || []
    const ageCategories = evt.ageCategories || []

    const created = []
    let registered = 0

    for (const b of boxers) {
      const fullName = (b.fullName || '').trim()
      if (!fullName) {
        return errorResponse({ message: 'Every boxer needs a name', status: 400 })
      }
      if (weightCategories.length && b.weight && !weightCategories.includes(b.weight)) {
        return errorResponse({ message: `${fullName}: select a valid weight category (${weightCategories.join(', ')})`, status: 400 })
      }
      if (ageCategories.length && b.age && !ageCategories.includes(b.age)) {
        return errorResponse({ message: `${fullName}: select a valid age category (${ageCategories.join(', ')})`, status: 400 })
      }

      let boxer = await Boxer.findOne({
        fullName: new RegExp(`^${fullName}$`, 'i'),
        clubName: clubName || null,
      })
      if (!boxer) {
        boxer = await Boxer.create({
          fullName,
          clubName: clubName || '',
          numberOfBouts: Number(b.numberOfBouts) || 1,
          gender: b.gender || null,
          weightCategory: b.weight || '',
          ageCategory: b.age || '',
        })
        created.push(boxer)
      }

      const existing = await Registration.findOne({ eventId: evt._id, boxerId: boxer._id })
      if (existing) {
        return errorResponse({ message: `"${fullName}" is already registered for this event`, status: 400 })
      }

      await Registration.create({
        eventId: evt._id,
        clubName: clubName || '',
        whatsapp: normalizedWhatsapp,
        email: cleanEmail,
        numberOfBouts: Number(b.numberOfBouts) || 1,
        boxerId: boxer._id,
        category: {
          weight: b.weight || '',
          age: b.age || '',
          gender: b.gender || '',
        },
        status: 'approved',
      })
      registered += 1
    }

    try {
      const gmailUser = process.env.GMAIL_USER
      const appPassword = process.env.GMAIL_APP_PASSWORD
      if (gmailUser && appPassword && cleanEmail) {
        const date = evt.eventDate
          ? new Date(evt.eventDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
          : ''
        const boxerLines = boxers.map((b, i) => {
          const parts = [`${i + 1}. ${(b.fullName || '').trim()}`]
          if (b.weight) parts.push(`Weight: ${b.weight}`)
          if (b.age) parts.push(`Age: ${b.age}`)
          if (b.gender) parts.push(`Gender: ${b.gender === 'M' ? 'Male' : 'Female'}`)
          if (Number(b.numberOfBouts) > 1) parts.push(`Bouts: ${b.numberOfBouts}`)
          return parts.join(' — ')
        })
        const text = [
          `Hello ${clubName || 'the club'},`,
          `Thank you for registering ${registered} boxer${registered === 1 ? '' : 's'} for ${evt.name}${date ? ` on ${date}` : ''}.`,
          'Here are the boxers added:',
          ...boxerLines,
          'We will review and confirm each entry. Best regards, Bodymax Events Team',
        ].join('\n')

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: gmailUser, pass: appPassword },
        })
        await transporter.sendMail({
          from: `"Bodymax Events" <${gmailUser}>`,
          to: [cleanEmail, gmailUser],
          replyTo: gmailUser,
          subject: `Thank you for registering ${registered} boxer${registered === 1 ? '' : 's'} — ${evt.name}`,
          text,
        })
      }
    } catch (e) {
      // Never fail the registration if the notification email fails
      console.warn('Registration notification email failed:', e.message)
    }

    return success({ registered, created: created.length }, 201)
  } catch (err) {
    return errorResponse(err)
  }
}
