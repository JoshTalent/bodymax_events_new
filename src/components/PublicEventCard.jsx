import { Link } from 'react-router-dom'
import { cn } from '../utils/cn.js'

export function EventBadge({ status, registrationOpen }) {
  let cls = 'bg-blue-50 text-blue-700 ring-blue-600/20'
  let label = 'Upcoming'
  if (status === 'completed' || status === 'archived') {
    cls = 'bg-slate-100 text-slate-600 ring-slate-400/20'
    label = 'Completed'
  } else if (status === 'in_progress') {
    cls = 'bg-rose-50 text-rose-700 ring-rose-600/20'
    label = 'Live Now'
  } else if (registrationOpen) {
    cls = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    label = 'Registration Open'
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1', cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', status === 'in_progress' ? 'animate-pulse bg-rose-500' : status === 'completed' ? 'bg-slate-400' : registrationOpen ? 'bg-emerald-500' : 'bg-blue-500')} />
      {label}
    </span>
  )
}

export default function PublicEventCard({ ev }) {
  const d = ev.eventDate ? new Date(ev.eventDate) : null
  const month = d ? d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : 'TBD'
  const day = d ? d.getDate() : '?'
  const year = d ? d.getFullYear() : ''
  const weights = ev.weightCategories?.slice(0, 3) || []

  return (
    <Link
      to={`/events/${ev._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 px-5 py-4">
        <div className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-brand-500/25 blur-2xl transition group-hover:bg-brand-500/40" />
        <div className="relative flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-300">
            {month} {year}
          </span>
          <EventBadge status={ev.status} registrationOpen={ev.registrationOpen} />
        </div>
        <p className="relative mt-1 text-3xl font-black text-white">{day}</p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-900 transition group-hover:text-brand-700">{ev.name}</h3>
        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-500">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {[ev.venue, ev.location].filter(Boolean).join(' · ') || 'Venue TBA'}
        </p>

        {weights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {weights.map((w) => (
              <span key={w} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{w}</span>
            ))}
          </div>
        )}

        <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand-600">
          View event
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </Link>
  )
}