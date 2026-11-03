import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Club from './_shared/models/Club.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import { requireAuth, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

const MONTH_LABEL = (d) => d.toLocaleDateString('en-GB', { month: 'short' })
const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`

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

    const [eventsRaw, clubs, boxers, regs] = await Promise.all([
      Event.find().lean(),
      Club.find().lean(),
      Boxer.find().lean(),
      Registration.find().lean(),
    ])

    const now = new Date()
    const events = [...eventsRaw]
    const openEvents = events.filter((e) => e.registrationOpen)
    const activeEvents = events.filter((e) => ['open', 'in_progress'].includes(e.status))

    const eventRegCounts = await Registration.aggregate([
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ])
    const countMap = new Map(eventRegCounts.map((g) => [String(g._id), g.count]))

    const topEvents = [...events]
      .sort((a, b) => new Date(b.eventDate || 0) - new Date(a.eventDate || 0))
      .slice(0, 6)
      .map((e) => ({ ...e, registrationCount: countMap.get(String(e._id)) || 0 }))

    const upcoming = events
      .filter((e) => e.eventDate && new Date(e.eventDate) >= new Date(now.toDateString()))
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))

    const seenAt = user.lastSeenRegistrationsAt ? new Date(user.lastSeenRegistrationsAt) : new Date(0)

    // ── Analytics ────────────────────────────────────────────────────────────
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { key: monthKey(d), label: MONTH_LABEL(d), year: d.getFullYear(), count: 0 }
    })
    const monthIndex = new Map(months.map((m, i) => [m.key, i]))
    for (const r of regs) {
      if (!r.createdAt) continue
      const d = new Date(r.createdAt)
      if (Number.isNaN(d.getTime())) continue
      const idx = monthIndex.get(monthKey(d))
      if (idx != null) months[idx].count += 1
    }

    const currentMonth = months[months.length - 1]?.count || 0
    const previousMonth = months[months.length - 2]?.count || 0
    const registrationGrowth = previousMonth > 0
      ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
      : currentMonth > 0 ? 100 : 0

    const statusGroups = [
      { key: 'pending', label: 'Pending review', color: '#f59e0b', statuses: ['registered', 'pending_approval', 'needs_correction'] },
      { key: 'approved', label: 'Approved', color: '#3b82f6', statuses: ['approved', 'awaiting_weighin'] },
      { key: 'weighed', label: 'Weighed in', color: '#8b5cf6', statuses: ['weighed'] },
      { key: 'eligible', label: 'Eligible', color: '#10b981', statuses: ['eligible', 'completed'] },
      { key: 'inactive', label: 'Withdrawn', color: '#94a3b8', statuses: ['withdrawn', 'not_eligible', 'eliminated'] },
    ]
    const statusBreakdown = statusGroups.map((g) => ({
      key: g.key,
      label: g.label,
      color: g.color,
      count: regs.filter((r) => g.statuses.includes(r.status)).length,
    }))

    const weightCounts = new Map()
    for (const r of regs) {
      const w = String(r.category?.weight || '').trim()
      if (!w) continue
      weightCounts.set(w, (weightCounts.get(w) || 0) + 1)
    }
    const weightDistribution = [...weightCounts.entries()]
      .sort((a, b) => (parseFloat(a[0]) || 999) - (parseFloat(b[0]) || 999))
      .slice(0, 7)
      .map(([label, count]) => ({ label, count }))

    const ageCounts = new Map()
    for (const r of regs) {
      const a = String(r.category?.age || '').trim()
      if (!a) continue
      ageCounts.set(a, (ageCounts.get(a) || 0) + 1)
    }
    const ageDistribution = [...ageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }))

    const clubCounts = new Map()
    for (const r of regs) {
      const name = String(r.clubName || '').trim() || 'Unattached'
      clubCounts.set(name, (clubCounts.get(name) || 0) + 1)
    }
    const topClubs = [...clubCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }))

    const genderSplit = {
      male: regs.filter((r) => r.category?.gender === 'M').length,
      female: regs.filter((r) => r.category?.gender === 'F').length,
      unspecified: regs.filter((r) => !['M', 'F'].includes(r.category?.gender)).length,
    }

    const weighedCount = regs.filter((r) => r.weighIn?.status === 'successful').length
    const eligibleCount = regs.filter((r) => ['eligible', 'completed'].includes(r.status)).length
    const pendingRegistrations = regs.filter((r) => ['pending_approval', 'needs_correction'].includes(r.status)).length
    const pendingPayments = regs.filter((r) => r.payment?.status === 'submitted').length

    const boxerMap = new Map(boxers.map((b) => [String(b._id), b.fullName]))
    const eventMap = new Map(events.map((e) => [String(e._id), e.name]))
    const recentActivity = [...regs]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6)
      .map((r) => ({
        id: r._id,
        boxer: boxerMap.get(String(r.boxerId)) || 'Boxer',
        club: r.clubName || 'Unattached',
        event: eventMap.get(String(r.eventId)) || 'Event',
        status: r.status,
        createdAt: r.createdAt,
      }))

    const eventStatusCounts = ['draft', 'open', 'closed', 'in_progress', 'completed', 'archived'].reduce((acc, s) => {
      acc[s] = events.filter((e) => e.status === s).length
      return acc
    }, {})

    return success({
      dashboard: {
        totalEvents: events.length,
        openEvents: openEvents.length,
        activeEvents: activeEvents.length,
        upcomingEvents: upcoming.length,
        clubCount: clubs.length,
        boxerCount: boxers.length,
        registrationCount: regs.length,
        newRegistrationCount: regs.filter((r) => new Date(r.createdAt) > seenAt).length,
        lastSeenRegistrationsAt: user.lastSeenRegistrationsAt || null,
        pendingRegistrations,
        pendingPayments,
        weighedCount,
        eligibleCount,
        events: topEvents,
        nextEvent: upcoming[0] ? { ...upcoming[0], registrationCount: countMap.get(String(upcoming[0]._id)) || 0 } : null,
        analytics: {
          registrationTrend: months.map((m) => ({ label: m.label, year: m.year, count: m.count })),
          registrationGrowth,
          currentMonth,
          previousMonth,
          statusBreakdown,
          weightDistribution,
          ageDistribution,
          topClubs,
          genderSplit,
          recentActivity,
          weighedCount,
          weighInProgress: regs.length ? Math.round((weighedCount / regs.length) * 100) : 0,
          eligibleRate: regs.length ? Math.round((eligibleCount / regs.length) * 100) : 0,
          avgRegistrationsPerEvent: events.length ? Math.round((regs.length / events.length) * 10) / 10 : 0,
          eventStatusCounts,
          clubCount: clubs.length,
          boxerCount: boxers.length,
        },
      },
    })
  } catch (err) {
    return errorResponse(err)
  }
}
