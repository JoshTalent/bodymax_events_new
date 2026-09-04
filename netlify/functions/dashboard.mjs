import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Club from './_shared/models/Club.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import { requireAuth, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    const user = await requireAuth(event)
    await connectDB()

    if (user.role === 'club') {
      const now = new Date()
      const events = await Event.find().lean()
      const regs = await Registration.find({ clubId: user.clubId }).sort({ createdAt: -1 }).lean()
      const recent = await Registration.find({ clubId: user.clubId })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('boxerId', 'fullName gender weightCategory ageCategory')
        .populate('eventId', 'name eventDate')
        .lean()

      const openEvents = events
        .filter((e) => e.registrationOpen)
        .sort((a, b) => (a.registrationDeadline || a.eventDate || 0) - (b.registrationDeadline || b.eventDate || 0))
        .slice(0, 5)

      return success({
        dashboard: {
          boxerCount: await Boxer.countDocuments({ clubId: user.clubId }),
          registeredCount: regs.length,
          pendingCount: regs.filter((r) => r.status === 'pending_approval' || r.status === 'needs_correction').length,
          approvedCount: regs.filter((r) => ['approved', 'payment_pending', 'payment_confirmed', 'awaiting_weighin', 'weighed', 'eligible'].includes(r.status)).length,
          pendingPayments: regs.filter((r) => r.payment?.status === 'submitted' || r.status === 'payment_pending').length,
          eventsOpen: openEvents.length,
          openEvents,
          recentRegistrations: recent,
        },
      })
    }

    const [events, clubs, boxers, regs] = await Promise.all([
      Event.find().lean(),
      Club.find().lean(),
      Boxer.find().lean(),
      Registration.find().lean(),
    ])

    const openEvents = events.filter((e) => e.registrationOpen)
    const activeEvents = events.filter((e) => ['open', 'in_progress'].includes(e.status))

    return success({
      dashboard: {
        totalEvents: events.length,
        openEvents: openEvents.length,
        activeEvents: activeEvents.length,
        clubCount: clubs.length,
        boxerCount: boxers.length,
        registrationCount: regs.length,
        pendingRegistrations: regs.filter((r) => r.status === 'pending_approval' || r.status === 'needs_correction').length,
        pendingPayments: regs.filter((r) => r.payment?.status === 'submitted').length,
        weighedCount: regs.filter((r) => r.weighIn?.status === 'successful').length,
        events: events.sort((a, b) => (b.eventDate || 0) - (a.eventDate || 0)).slice(0, 5),
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
