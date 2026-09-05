import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'
import { cn } from '../../utils/cn.js'

function StatusPill({ status }) {
  const map = {
    scheduled: 'bg-blue-50 text-blue-700 ring-blue-200',
    ready: 'bg-blue-50 text-blue-700 ring-blue-200',
    in_progress: 'bg-amber-50 text-amber-700 ring-amber-200',
    walkover: 'bg-amber-50 text-amber-700 ring-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    postponed: 'bg-slate-100 text-slate-600 ring-slate-200',
    cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
  }
  const label = {
    scheduled: 'Scheduled',
    ready: 'Ready',
    in_progress: 'In Progress',
    walkover: 'Walkover',
    completed: 'Completed',
    postponed: 'Postponed',
    cancelled: 'Cancelled',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', map[status] || 'bg-slate-100 text-slate-600 ring-slate-200')}>
      {label[status] || status.replace('_', ' ')}
    </span>
  )
}

function Fighter({ reg, isWinner }) {
  const n = reg?.boxerId?.fullName
  const c = reg?.clubName || reg?.boxerId?.clubName || reg?.clubId?.name || ''

  if (!n) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
        <span className="text-sm italic text-slate-400">Bye — no opponent</span>
      </div>
    )
  }

  const initials = n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className={cn(
      'flex flex-1 items-center gap-3 rounded-xl border px-4 py-4',
      isWinner ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
    )}>
      <span className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold',
        isWinner ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
      )}>
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold text-slate-900">{n}</span>
        <span className="block truncate text-sm text-slate-500">{c || 'Individual'}</span>
      </span>
      {isWinner && (
        <span className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">Winner</span>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70">
        {icon}
      </span>
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="block text-sm font-medium text-white">{value}</span>
      </span>
    </div>
  )
}

export default function PublicDraws() {
  const { token } = useParams()
  const [event, setEvent] = useState(null)
  const [bouts, setBouts] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api(`/draws/public?token=${encodeURIComponent(token)}`)
      .then((d) => {
        setEvent(d.event)
        setBouts(d.bouts || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-950">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white">B</span>
            <span className="text-lg font-bold text-white">Bodymax</span>
          </Link>
          {event?.eventDate && (
            <span className="text-xs font-medium text-slate-400">
              {new Date(event.eventDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      </header>

      {error ? (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-slate-500">{error}</p>
          <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">← Back to home</Link>
        </div>
      ) : (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          {/* Hero */}
          <section className="overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
            <div className="bg-[radial-gradient(60%_120%_at_100%_0%,rgba(59,130,246,0.25),transparent)] px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">Official Draw</p>
                  <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{event?.name}</h1>
                  <p className="mt-1 text-sm text-slate-400">Live fight card · read only</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-white px-5 py-3 text-center shadow-lg">
                    <p className="text-2xl font-bold text-slate-900">{bouts.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bouts</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
                <InfoRow icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>} label="Venue" value={event?.venue} />
                <InfoRow icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>} label="Location" value={event?.location} />
                <InfoRow icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>} label="Date" value={event?.eventDate ? new Date(event.eventDate).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'} />
              </div>
            </div>
          </section>

          {/* Bout list */}
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Bout Order</h2>
              <span className="text-xs font-medium text-slate-500">Results update automatically</span>
            </div>

            {bouts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">No bouts announced yet</h3>
                <p className="mt-1 text-sm text-slate-500">The draw is being finalised. Please check back soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bouts.map((b, i) => {
                  const winnerId = b.winnerId
                  const isWinnerA = winnerId && String(winnerId) === String(b.boxerAId?._id)
                  const isWinnerB = winnerId && String(winnerId) === String(b.boxerBId?._id)
                  const hasBye = !b.boxerAId || !b.boxerBId
                  return (
                    <article key={b._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Bout #{b.boutNumber}</p>
                            <p className="text-xs text-slate-500">
                              {b.category?.weight || 'All weights'}
                              {b.category?.age ? ` · ${b.category.age}` : ''}
                            </p>
                          </div>
                        </div>
                        <StatusPill status={b.status} />
                      </div>

                      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                        <Fighter reg={b.boxerAId} isWinner={isWinnerA} />
                        <span className="self-center flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold uppercase text-white sm:mx-1">
                          vs
                        </span>
                        <Fighter reg={b.boxerBId} isWinner={isWinnerB} />
                      </div>

                      {(b.status === 'completed' || b.status === 'walkover') && (
                        <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          {b.status === 'walkover' && hasBye
                            ? 'Walkover — opponent unavailable.'
                            : `Result: ${b.result?.method || 'Decision'}${b.result?.round ? ` · Round ${b.result.round}` : ''}`}
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      )}

      <footer className="border-t border-slate-200 bg-white py-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Powered by <span className="text-slate-700">Bodymax</span> · Live event management
        </p>
      </footer>
    </div>
  )
}