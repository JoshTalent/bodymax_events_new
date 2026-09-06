import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { PublicNavbar, PublicFooter } from '../../components/PublicSite.jsx'
import PublicEventCard from '../../components/PublicEventCard.jsx'
import { cn } from '../../utils/cn.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'live', label: 'Live' },
  { key: 'completed', label: 'Completed' },
]

export default function PublicEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api('/public-events')
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const isUpcoming = (e) => e.status !== 'completed' && e.status !== 'archived'
  const isLive = (e) => e.status === 'in_progress'

  const visible =
    filter === 'upcoming' ? events.filter(isUpcoming)
      : filter === 'live' ? events.filter(isLive)
        : filter === 'completed' ? events.filter((e) => !isUpcoming(e))
          : events

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar active="events" />

      {/* ===== Page hero ===== */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-brand-600/25 blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-rose-600/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-300 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
            Fight Nights
          </p>
          <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl">
            Upcoming Events
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-400">
            Browse official fight cards — open draws, live results and boxer registration for every sanctioned night.
          </p>

          {/* Filters */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const count = f.key === 'all' ? events.length
                : f.key === 'upcoming' ? events.filter(isUpcoming).length
                  : f.key === 'live' ? events.filter(isLive).length
                    : events.filter((e) => !isUpcoming(e)).length
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                    filter === f.key
                      ? 'bg-white text-slate-900 shadow-lg'
                      : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {f.label}
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    filter === f.key ? 'bg-brand-600 text-white' : 'bg-white/10 text-slate-400'
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== Event grid ===== */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">No events in this category</h3>
            <p className="mt-1 text-sm text-slate-500">Try a different filter, or check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((ev) => <PublicEventCard key={ev._id} ev={ev} />)}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}