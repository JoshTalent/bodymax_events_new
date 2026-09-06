import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { cn } from '../../utils/cn.js'

function EventBadge({ status, registrationOpen }) {
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

function EventCard({ ev }) {
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
      {/* Date band */}
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

      {/* Body */}
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

function Countdown({ target }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const diff = Math.max(0, target - Date.now())
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)

  const cell = (v, label) => (
    <div key={label} className="flex flex-col items-center rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10 backdrop-blur">
      <span className="font-mono text-xl font-black tabular-nums text-white sm:text-2xl">{String(v).padStart(2, '0')}</span>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  )

  return (
    <div className="grid grid-cols-4 gap-2">
      {cell(days, 'Days')}
      {cell(hours, 'Hrs')}
      {cell(mins, 'Min')}
      {cell(secs, 'Sec')}
    </div>
  )
}

const features = [
  {
    title: 'Smart Draw Management',
    desc: 'Build official fight cards in minutes with live bracket control, reordering and instant updates.',
    icon: 'M3.75 6A1.5 1.5 0 015.25 4.5h13.5A1.5 1.5 0 0120.25 6v8.25A1.5 1.5 0 0118.75 15H5.25A1.5 1.5 0 013.75 15V6z M8.25 18h7.5M12 15v3m-6.75.75h13.5a.75.75 0 000-1.5h-13.5z',
  },
  {
    title: 'Live Results, Instantly',
    desc: 'Official results flow from the corner to fans in real time — winner, method, and round on every card.',
    icon: 'M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Seamless Registration',
    desc: 'Clubs register boxers in seconds through a shareable link — categories, weights and eligibility handled.',
    icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477M15 6.75a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    title: 'Public Fight Cards',
    desc: 'Share the draw anywhere — fans get a read-only, bilingual card that updates itself as results land.',
    icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941',
  },
]

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api('/public-events')
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  const upcoming = events.filter((e) => e.status !== 'completed' && e.status !== 'archived')
  const nextEvent = events
    .filter((e) => e.eventDate && e.status !== 'completed' && e.status !== 'archived')
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))[0] || null
  const completedCount = events.filter((e) => e.status === 'completed').length
  const categoryCount = events.reduce((s, e) => s + (e.weightCategories?.length || 0), 0)

  const stats = [
    { label: 'Upcoming Events', value: upcoming.length },
    { label: 'Completed Cards', value: completedCount },
    { label: 'Weight Categories', value: categoryCount },
    { label: 'Live Deploys', value: '24/7' },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ===== Navbar ===== */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
            <span className="text-lg font-black tracking-tight text-white">Bodymax</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:block">Home</Link>
            <Link to="/events" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:block">Events</Link>
            {user ? (
              <>
                <Link to="/app" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500">
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="text-sm font-semibold text-slate-300 transition hover:text-white">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-brand-50">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-slate-950">
        {/* backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-[26rem] w-[26rem] rounded-full bg-rose-600/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-6 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Left — copy */}
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-300 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                Live tournament management
              </p>
              <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl">
                Championship boxing,
                <span className="bg-gradient-to-r from-brand-400 via-blue-300 to-rose-300 bg-clip-text text-transparent"> mastered.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
                Bodymax powers fight nights end to end — draws, boxer registration, live results and public fight cards, unified in one clean platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-600/40 transition hover:bg-brand-500"
                >
                  View Upcoming Events
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Explore Fight Cards
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg>
                  Live results
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg>
                  Bilingual fight cards
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg>
                  Promoter-ready tools
                </span>
              </div>
            </div>

            {/* Right — next event glass card */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-brand-600/30 via-transparent to-rose-600/30 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                {nextEvent ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300">Next Event</p>
                      <EventBadge status={nextEvent.status} registrationOpen={nextEvent.registrationOpen} />
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-white sm:text-2xl">{nextEvent.name}</h3>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {[nextEvent.venue, nextEvent.location].filter(Boolean).join(' · ') || 'Venue TBA'}
                    </p>

                    <div className="mt-6">
                      <Countdown target={new Date(nextEvent.eventDate).getTime()} />
                    </div>

                    <Link
                      to={`/events/${nextEvent._id}`}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-brand-50"
                    >
                      View fight card
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                      <svg className="h-7 w-7 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-white">Season lined up</h3>
                    <p className="mt-1 text-sm text-slate-400">New fight nights are being scheduled. Check back soon.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats band ===== */}
      <section className="relative z-10 mx-auto -mt-12 max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:grid-cols-4 sm:p-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Upcoming Events ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Fight Nights</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Upcoming Events</h2>
            <p className="mt-2 max-w-lg text-slate-500">Official draws, live results and full fight cards for every sanctioned card.</p>
          </div>
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700">
            All events
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <h3 className="text-lg font-bold text-slate-900">No public events yet</h3>
            <p className="mt-1 text-sm text-slate-500">Check back soon — fight nights are on the way.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => <EventCard key={ev._id} ev={ev} />)}
          </div>
        )}
      </section>

      {/* ===== Features ===== */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">The Platform</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Everything around the ring</h2>
            <p className="mt-3 text-slate-500">From the first registration to the final result — Bodymax keeps every moving part in one place.</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25 transition group-hover:scale-105">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-rose-600/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight text-white sm:text-5xl">
            Promoter? Run the whole card from one dashboard.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-slate-400">Create events, manage registrations, build draws and record results in real time.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Link to="/app" className="rounded-xl bg-brand-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-brand-600/40 transition hover:bg-brand-500">
                Open Dashboard
              </Link>
            ) : (
              <Link to="/login" className="rounded-xl bg-brand-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-brand-600/40 transition hover:bg-brand-500">
                Sign In to Get Started
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/10 bg-slate-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
            <div className="text-center md:text-left">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
                <span className="text-lg font-black tracking-tight text-white">Bodymax</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm text-slate-500">Live event management for championship boxing — draws, results and everything between.</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Powered by Bodymax · Live event management
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Explore</p>
                <ul className="mt-3 space-y-2.5">
                  <li><Link to="/" className="text-slate-500 transition hover:text-white">Home</Link></li>
                  <li><Link to="/events" className="text-slate-500 transition hover:text-white">Events</Link></li>
                  <li><Link to="/login" className="text-slate-500 transition hover:text-white">Sign in</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Promoters</p>
                <ul className="mt-3 space-y-2.5">
                  {user ? (
                    <li><Link to="/app" className="text-slate-500 transition hover:text-white">Dashboard</Link></li>
                  ) : (
                    <>
                      <li><Link to="/login" className="text-slate-500 transition hover:text-white">Sign in</Link></li>
                      <li><Link to="/app" className="text-slate-500 transition hover:text-white">Dashboard</Link></li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} Bodymax Tournament Management
          </div>
        </div>
      </footer>
    </div>
  )
}