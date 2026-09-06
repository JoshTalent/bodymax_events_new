import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'
import { PublicNavbar, PublicFooter } from '../../components/PublicSite.jsx'
import { EventBadge } from '../../components/PublicEventCard.jsx'

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

function Chip({ children }) {
  return (
    <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
      {children}
    </span>
  )
}

export default function PublicEventDetail() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api(`/public-events?id=${id}`)
      .then((d) => setEvent(d.event))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicNavbar />
        <Loading />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicNavbar />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Event not found</h1>
          <p className="mt-2 text-slate-500">This event either doesn't exist or hasn't been published yet.</p>
          <Link to="/events" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500">
            ← Back to events
          </Link>
        </div>
        <PublicFooter />
      </div>
    )
  }

  const d = event.eventDate ? new Date(event.eventDate) : null
  const dateStr = d ? d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA'
  const regDeadline = event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const weighInStr = event.weighInDate ? new Date(event.weighInDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : null

  const regOpen = event.registrationOpen && !['completed', 'archived', 'closed'].includes(event.status)
  const hasRegisterLink = regOpen && Boolean(event.registrationToken)
  const registerUrl = `/register/${event.registrationToken}`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar />

      {/* ===== Event hero ===== */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute -top-28 right-16 h-80 w-80 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 h-80 w-80 rounded-full bg-rose-600/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            All events
          </Link>

          <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <EventBadge status={event.status} registrationOpen={event.registrationOpen} />
                {d && (
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-300">{dateStr}</span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">{event.name}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-400">
                {event.venue && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {event.venue}
                  </span>
                )}
                {event.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {event.location}
                  </span>
                )}
              </p>
            </div>

            {hasRegisterLink ? (
              <Link
                to={registerUrl}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-4 text-sm font-bold text-white shadow-2xl shadow-brand-600/40 transition hover:bg-brand-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Register Boxers
              </Link>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-semibold text-slate-300 backdrop-blur">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Registration Closed
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ===== Body ===== */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
          {/* Left column */}
          <div className="space-y-6">
            {event.description && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  About This Event
                </h2>
                <p className="mt-3 whitespace-pre-line text-slate-600">{event.description}</p>
              </section>
            )}

            {(event.weightCategories?.length > 0 || event.ageCategories?.length > 0 || event.genderCategories?.length > 0) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="grid gap-8 sm:grid-cols-2">
                  {event.weightCategories?.length > 0 && (
                    <div>
                      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                        <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                        </svg>
                        Weight Categories
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.weightCategories.map((c) => <Chip key={c}>{c}</Chip>)}
                      </div>
                    </div>
                  )}
                  {event.ageCategories?.length > 0 && (
                    <div>
                      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                        <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        Age Categories
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.ageCategories.map((c) => <Chip key={c}>{c}</Chip>)}
                      </div>
                    </div>
                  )}
                  {event.genderCategories?.length > 0 && (
                    <div>
                      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                        <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        Gender Categories
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.genderCategories.map((c) => <Chip key={c}>{c}</Chip>)}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {(event.registrationRequirements || event.rules) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <svg className="h-5 w-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Requirements & Rules
                </h2>
                {event.registrationRequirements && (
                  <div className="mt-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Registration Requirements</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{event.registrationRequirements}</p>
                  </div>
                )}
                {event.rules && (
                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Rules</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{event.rules}</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right column — registration / at a glance */}
          <aside className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-900 px-6 py-5">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Registration</h2>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Status</span>
                  {regOpen ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Closed
                    </span>
                  )}
                </div>
                {regDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Deadline</span>
                    <span className="text-sm font-semibold text-slate-800">{regDeadline}</span>
                  </div>
                )}
                {event.requireWeighIn && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Weigh-in</span>
                    <span className="text-sm font-semibold text-slate-800">{weighInStr || 'Required'}</span>
                  </div>
                )}

                {hasRegisterLink ? (
                  <Link
                    to={registerUrl}
                    className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Register your boxers
                  </Link>
                ) : (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                    Registration for this event is currently closed.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">At a Glance</h2>
              <div className="mt-4 space-y-4">
                <InfoRow label="Date" value={dateStr} />
                <InfoRow label="Venue" value={event.venue} />
                <InfoRow label="Location" value={event.location} />
                <InfoRow label="Weight In" value={weighInStr} />
              </div>
              {event.weightCategories?.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Divisions</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{event.weightCategories.length} weight classes</p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}