import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'
import { Badge } from '../../components/Badge.jsx'
import { Button } from '../../components/Button.jsx'
import { cn } from '../../utils/cn.js'

const fmtDate = (iso) => {
  if (!iso) return 'Date TBD'
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(iso) {
  if (!iso) return '—'
  const diff = Math.round((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  if (diff < 0) return 'Passed'
  if (diff === 0) return 'Today'
  return `${diff}d`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ label, value, sub, to, accent }) {
  const accents = {
    brand: 'text-brand-700',
    emerald: 'text-emerald-600',
    slate: 'text-slate-900',
    blue: 'text-blue-700',
    amber: 'text-amber-600',
  }
  return (
    <Link
      to={to || '#'}
      className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-1 text-3xl font-bold', accents[accent] || accents.brand)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Link>
  )
}

export default function PromoterDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api('/dashboard').then((d) => setData(d.dashboard)).catch(() => {})
  }, [])

  if (!data) return <Loading label="Loading dashboard..." />

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">{greeting()} — here's what's happening across your events.</p>
        </div>
        <Link to="/app/events/new">
          <Button>+ New Event</Button>
        </Link>
      </div>

      {(data.pendingRegistrations > 0 || data.pendingPayments > 0) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg">⚡</span>
            <div>
              <p className="font-semibold text-amber-900">Action needed</p>
              <p className="text-sm text-amber-800">
                {data.pendingRegistrations > 0 && `${data.pendingRegistrations} registration${data.pendingRegistrations === 1 ? '' : 's'} pending approval`}
                {data.pendingRegistrations > 0 && data.pendingPayments > 0 && ' · '}
                {data.pendingPayments > 0 && `${data.pendingPayments} payment${data.pendingPayments === 1 ? '' : 's'} to review`}
              </p>
            </div>
          </div>
          <Link to="/app/registrations">
            <Button size="sm" variant="secondary">Review now</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Events" value={data.totalEvents} sub={`${data.activeEvents} active`} to="/app/events" accent="brand" />
        <StatCard label="Open Registrations" value={data.openEvents} sub={`${data.upcomingEvents} upcoming`} to="/app/events" accent="emerald" />
        <StatCard label="Clubs" value={data.clubCount} to="/app/clubs" accent="blue" />
        <StatCard label="Boxers" value={data.boxerCount} to="/app/boxers" accent="slate" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Registrations" value={data.registrationCount} to="/app/registrations" accent="blue" />
        <StatCard label="Pending Approvals" value={data.pendingRegistrations} to="/app/registrations" accent="amber" />
        <StatCard label="Eligible Boxers" value={data.eligibleCount} sub="Ready for the draw" to="/app/registrations" accent="emerald" />
        <StatCard label="Weighed In" value={data.weighedCount} to="/app/registrations" accent="slate" />
      </div>

      {data.nextEvent && (
        <div className="mt-6 overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-brand-900 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Next Up</p>
              <p className="mt-1 text-xl font-bold">{data.nextEvent.name}</p>
              <p className="text-sm text-slate-300">
                {fmtDate(data.nextEvent.eventDate)} · {data.nextEvent.venue}
                {data.nextEvent.registrationCount ? ` · ${data.nextEvent.registrationCount} registered` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold">
                {daysUntil(data.nextEvent.eventDate)}
              </span>
              <Link to={`/app/events/${data.nextEvent._id}`}>
                <Button variant="secondary">Open Event</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Events</h3>
              <p className="text-sm text-slate-500">Manage each event, its draw and results</p>
            </div>
            <Link to="/app/events">
              <Button size="sm" variant="secondary">View All</Button>
            </Link>
          </div>
          {data.events.length === 0 ? (
            <Empty title="No events yet" message="Create your first event to get started." action={
              <Link to="/app/events/new"><Button>New Event</Button></Link>
            } />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">Event</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Registrations</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.events.map((ev) => (
                    <tr key={ev._id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <Link to={`/app/events/${ev._id}`} className="group flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                            {ev.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'EV'}
                          </span>
                          <span>
                            <span className="block font-semibold text-slate-900 group-hover:text-brand-700">{ev.name}</span>
                            <span className="block text-xs text-slate-500">{ev.venue || 'Venue TBA'}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className="font-medium text-slate-800">{fmtDate(ev.eventDate)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-900">{ev.registrationCount}</span>
                        <span className="text-xs text-slate-400"> boxers</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={ev.registrationOpen ? 'blue' : 'slate'}>
                          {ev.registrationOpen ? 'Open' : ev.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/app/events/${ev._id}/draws`}>
                            <Button size="sm" variant="secondary">Draws</Button>
                          </Link>
                          <Link to={`/app/events/${ev._id}/results`}>
                            <Button size="sm" variant="secondary">Results</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}