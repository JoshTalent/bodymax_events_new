import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading } from '../../components/Loading.jsx'
import { StatusBadge } from '../../components/Badge.jsx'

function StatCard({ label, value, to, icon, accent }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${accent}`}>{icon}</div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-600 opacity-0 transition group-hover:opacity-100" />
    </Link>
  )
}

const icons = {
  boxer: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  register: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-6 9l2 2 4-4m-3-7V3m4 2h6" />
    </svg>
  ),
  clock: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pay: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h2m4 0h6m-4-2v-6m0 0h6m0-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7M9 10V7m6 8H9m16 0V7" />
    </svg>
  ),
}

function formatDate(d) {
  if (!d) return 'Date TBA'
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function ClubDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    api('/dashboard').then((d) => setData(d.dashboard)).catch(() => {})
  }, [])

  if (!data) return <Loading label="Loading your dashboard..." />

  const stats = [
    { label: 'My Boxers', value: data.boxerCount, to: '/app/club/boxers', icon: icons.boxer, accent: 'bg-blue-50 text-blue-600' },
    { label: 'Total Registrations', value: data.registeredCount, to: '/app/club/register', icon: icons.register, accent: 'bg-violet-50 text-violet-600' },
    { label: 'Pending Approval', value: data.pendingCount, to: '/app/club/register', icon: icons.clock, accent: 'bg-amber-50 text-amber-600' },
    { label: 'Approved', value: data.approvedCount, to: '/app/club/register', icon: icons.check, accent: 'bg-emerald-50 text-emerald-600' },
  ]

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-slate-300">{getGreeting()},</p>
          <h1 className="mt-0.5 text-2xl font-bold sm:text-3xl">{user?.name?.split(' ')[0] || 'Coach'}</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-300">
            Manage your boxers and registrations from one place.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/app/club/register"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Register a boxer
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
            <Link
              to="/app/club/boxers"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur transition hover:bg-white/20"
            >
              Manage boxers
            </Link>
            {data.eventsOpen > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {data.eventsOpen} open event{data.eventsOpen === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Payments + upcoming in compact row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">{icons.pay}</div>
            <div>
              <p className="text-sm font-medium text-slate-500">Payments Pending</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">{data.pendingPayments ?? 0}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Registrations needing payment action before they can go forward.
          </p>
        </Card>

        <Card className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Upcoming Events</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">{data.eventsOpen ?? 0}</p>
            </div>
            {data.openEvents?.length > 0 && (
              <Link to="/app/events" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            )}
          </div>
          {data.openEvents?.length > 0 && (
            <div className="mt-4 space-y-2">
              {data.openEvents.slice(0, 2).map((e) => (
                <div key={e._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <p className="truncate text-sm font-medium text-slate-800">{e.name}</p>
                  <p className="ml-2 shrink-0 text-xs text-slate-500">{formatDate(e.eventDate)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent registrations */}
      <div className="mt-6">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Recent Registrations</h3>
            <Link to="/app/club/register" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {data.recentRegistrations?.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              You have not registered any boxers yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {data.recentRegistrations.map((r) => (
                <li key={r._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                    <p className="truncate text-sm text-slate-500">{r.eventId?.name || 'Event'}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}