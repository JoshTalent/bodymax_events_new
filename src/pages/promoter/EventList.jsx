import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Loading, Empty } from '../../components/Loading.jsx'
import { StatusBadge } from '../../components/Badge.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { Icon } from '../../components/Icons.jsx'
import { cn } from '../../utils/cn.js'

const fmtDate = (iso) => {
  if (!iso) return 'Date TBD'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const daysUntil = (iso) => {
  if (!iso) return null
  const diff = Math.round((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  if (diff < 0) return null
  if (diff === 0) return 'Today'
  return `${diff} day${diff === 1 ? '' : 's'} to go`
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'EV'
}

const FILTERS = [
  { id: 'all', label: 'All events' },
  { id: 'open', label: 'Registration open' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'pro', label: 'Professional fight nights' },
]

export default function EventList() {
  const [events, setEvents] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api('/events').then((d) => setEvents(d.events)).catch(() => {})
  }, [])

  const stats = useMemo(() => {
    const list = events || []
    return {
      total: list.length,
      open: list.filter((e) => e.registrationOpen).length,
      upcoming: list.filter((e) => e.eventDate && new Date(e.eventDate) >= new Date(new Date().toDateString())).length,
      completed: list.filter((e) => ['completed', 'archived'].includes(e.status)).length,
    }
  }, [events])

  const filtered = useMemo(() => {
    let list = events || []
    if (filter === 'open') list = list.filter((e) => e.registrationOpen)
    if (filter === 'upcoming') list = list.filter((e) => e.eventDate && new Date(e.eventDate) >= new Date(new Date().toDateString()))
    if (filter === 'completed') list = list.filter((e) => ['completed', 'archived'].includes(e.status))
    if (filter === 'pro') list = list.filter((e) => e.eventType === 'professional')
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (e) =>
          (e.name || '').toLowerCase().includes(q) ||
          (e.venue || '').toLowerCase().includes(q) ||
          (e.location || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [events, filter, search])

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Events"
        description="Create, publish and run every tournament from a single command center."
        actions={
          <>
            <Link
              to="/app/registrations"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Icon name="registrations" className="h-4 w-4 text-slate-400" />
              Registrations
            </Link>
            <Link
              to="/app/events/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition hover:from-brand-700 hover:to-indigo-700"
            >
              <Icon name="plus" className="h-4 w-4" />
              New Event
            </Link>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Total events', value: stats.total, icon: 'events', tone: 'bg-brand-50 text-brand-600' },
          { label: 'Registration open', value: stats.open, icon: 'registrations', tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Upcoming', value: stats.upcoming, icon: 'calendar', tone: 'bg-violet-50 text-violet-600' },
          { label: 'Completed', value: stats.completed, icon: 'checkCircle', tone: 'bg-slate-100 text-slate-600' },
        ].map((s, i) => (
          <div key={s.label} className={cn('console-card animate-rise flex items-center gap-3 p-4', `delay-${i + 1}`)}>
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', s.tone)}>
              <Icon name={s.icon} className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-xl font-black leading-tight text-slate-900">{events ? s.value : '—'}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="animate-rise delay-2 console-card mb-5 flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[11px] font-bold transition',
                filter === f.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 sm:max-w-xs">
          <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, venues..."
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="rounded p-0.5 text-slate-400 hover:text-slate-600" aria-label="Clear search">
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {!events ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="console-card">
          <Empty
            title={events.length === 0 ? 'No events yet' : 'No matching events'}
            message={events.length === 0 ? 'Create your first boxing event to get started.' : 'Try a different filter or search term.'}
            action={
              events.length === 0 ? (
                <Link to="/app/events/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white">
                  <Icon name="plus" className="h-4 w-4" />
                  Create event
                </Link>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ev, i) => {
            const countdown = daysUntil(ev.eventDate)
            const isPro = ev.eventType === 'professional'
            return (
              <article
                key={ev._id}
                className={cn(
                  'animate-rise group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_45px_-28px_rgba(15,23,42,0.4)]',
                  i < 3 ? `delay-${i + 2}` : 'delay-3'
                )}
              >
                <span className={cn('absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r', ev.registrationOpen ? 'from-emerald-400 to-teal-500' : 'from-slate-300 to-slate-400')} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/app/events/${ev._id}`} className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-[11px] font-black text-white shadow-sm">
                        {initials(ev.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-slate-900 group-hover:text-brand-700">{ev.name}</span>
                        <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500">
                          <Icon name="flag" className="h-3 w-3 shrink-0" />
                          {ev.venue || 'Venue TBA'}
                        </span>
                      </span>
                    </Link>
                    <StatusBadge status={ev.registrationOpen ? 'open' : ev.status} />
                    {isPro && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                        <Icon name="trophy" className="h-3 w-3" />
                        Pro
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <Icon name="calendar" className="h-3 w-3" />
                        Event date
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-slate-800">{fmtDate(ev.eventDate)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <Icon name="registrations" className="h-3 w-3" />
                        Entries
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-slate-800">
                        {ev.registrationCount || 0}
                        <span className="ml-1 font-medium text-slate-400">registered</span>
                      </p>
                    </div>
                  </div>

                  {countdown && (
                    <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
                      <Icon name="clock" className="h-3 w-3" />
                      {countdown}
                    </p>
                  )}
                  {!countdown && ev.eventDate && (
                    <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                      <Icon name="checkCircle" className="h-3 w-3" />
                      Event passed
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                    <Link
                      to={`/app/events/${ev._id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 transition hover:text-brand-800"
                    >
                      Open event
                      <Icon name="arrowUpRight" className="h-3.5 w-3.5" />
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/app/events/${ev._id}/draws`}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                      >
                        Draws
                      </Link>
                      <Link
                        to={`/app/events/${ev._id}/results`}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                      >
                        Results
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
