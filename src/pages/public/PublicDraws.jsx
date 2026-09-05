import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'
import { cn } from '../../utils/cn.js'

function StatusPill({ status }) {
  const map = {
    scheduled: 'bg-white/10 text-white ring-white/20',
    ready: 'bg-white/10 text-white ring-white/20',
    in_progress: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
    walkover: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
    completed: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
    postponed: 'bg-white/5 text-slate-400 ring-white/10',
    cancelled: 'bg-white/5 text-slate-400 ring-white/10',
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
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1',
      map[status] || 'bg-white/5 text-slate-400 ring-white/10'
    )}>
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === 'completed' ? 'bg-emerald-400' : status === 'walkover' || status === 'in_progress' ? 'bg-amber-400' : 'bg-white/40'
      )} />
      {label[status] || status.replace('_', ' ')}
    </span>
  )
}

function Avatar({ name, size = 'lg', tone = 'gold' }) {
  const initials = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <span className={cn(
      'relative inline-flex shrink-0 items-center justify-center rounded-full font-black uppercase',
      size === 'lg' ? 'h-14 w-14 text-base' : 'h-10 w-10 text-xs',
      tone === 'gold'
        ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
        : 'bg-gradient-to-br from-slate-700 to-slate-600 text-white shadow-lg shadow-black/30'
    )}>
      {initials}
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/25" />
    </span>
  )
}

function FighterCard({ reg, isWinner }) {
  const n = reg?.boxerId?.fullName
  const c = reg?.clubName || reg?.boxerId?.clubName || reg?.clubId?.name || ''
  const w = reg?.category?.weight
  const a = reg?.category?.age

  if (!n) {
    return (
      <div className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/30">Bye</span>
      </div>
    )
  }

  return (
    <div className={cn(
      'relative flex flex-1 flex-col items-center gap-3 rounded-2xl border px-4 py-5 text-center transition-all duration-300',
      isWinner
        ? 'border-amber-400/50 bg-gradient-to-b from-amber-400/15 to-amber-400/5 shadow-xl shadow-amber-500/10'
        : 'border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] hover:border-white/20'
    )}>
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        {w && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300 ring-1 ring-white/10">{w}</span>}
        {a && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300 ring-1 ring-white/10">{a}</span>}
      </div>

      <Avatar name={n} tone={isWinner ? 'gold' : 'slate'} />

      <div className="min-w-0">
        <p className={cn('text-base font-bold leading-tight', isWinner ? 'text-amber-300' : 'text-white')}>{n}</p>
        {c ? (
          <p className="mt-0.5 text-xs font-medium text-slate-400">{c}</p>
        ) : (
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Individual</p>
        )}
      </div>

      {isWinner && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.6-6.2 4.6 2.4-7.4L2 9.4h7.6L12 2z" /></svg>
          Winner
        </span>
      )}
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

  const boxers = new Set(
    (bouts || []).flatMap((b) => [b.boxerAId?._id, b.boxerBId?._id]).filter(Boolean).map(String)
  ).size
  const divisions = new Set((bouts || []).map((b) => b.category?.weight).filter(Boolean)).size

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(80%_50%_at_50%_-10%,rgba(59,130,246,0.15),transparent)]" />

      <header className="relative z-10 border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white shadow-lg shadow-brand-500/30">B</span>
            <span className="text-lg font-black tracking-tight text-white">Bodymax</span>
          </Link>
          {event?.eventDate && (
            <span className="hidden text-xs font-semibold uppercase tracking-widest text-slate-400 sm:block">
              {new Date(event.eventDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      </header>

      {error ? (
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
            <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Unable to load this draw</h2>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10">
            ← Back to home
          </Link>
        </div>
      ) : (
        <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24">
          {/* Hero */}
          <section className="pt-14 text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">Official Fight Card · Now Updated</span>
            </div>
            <h1 className="text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-6xl">
              {event?.name?.split(' ').map((word, i) => (
                <span key={i} className={i % 2 ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500' : ''}>
                  {word}{' '}
                </span>
              ))}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
              The official pairing list for this event. Results update here as bouts are completed.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
              {[['Venue', event?.venue], ['Location', event?.location]].filter(([, v]) => v).map(([label, value]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] px-4 py-2 ring-1 ring-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
                  <span className="font-semibold text-white">{value}</span>
                </span>
              ))}
            </div>

            <div className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-3">
              {[
                { value: bouts.length, label: 'Bouts' },
                { value: boxers, label: 'Boxers' },
                { value: divisions, label: 'Divisions' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent px-4 py-4">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Draw list */}
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400">The Draw</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Bout Order</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-white/10">
                {bouts.length} bout{bouts.length === 1 ? '' : 's'} · Read only
              </span>
            </div>

            {bouts.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-700/10 ring-1 ring-white/10">
                  <svg className="h-7 w-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6H21m0-12H10.5m2.25 0A2.25 2.25 0 0015 6.75m2.25-2.25c0-1.24-1.146-2.25-2.31-2.25m-4.44 4.5A2.25 2.25 0 009 4.5h4.5M15 4.5a2.25 2.25 0 012.25 2.25V9" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">No bouts announced yet</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">The draw is still being finalised. Check back soon to see the official pairings.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bouts.map((b, i) => {
                  const winnerId = b.winnerId
                  const isWinnerA = winnerId && String(winnerId) === String(b.boxerAId?._id)
                  const isWinnerB = winnerId && String(winnerId) === String(b.boxerBId?._id)
                  const hasBye = !b.boxerAId || !b.boxerBId
                  return (
                    <article
                      key={b._id}
                      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-5 transition-colors hover:border-white/20 sm:p-6"
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-sm font-black text-white ring-1 ring-white/10">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Bout #{b.boutNumber}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              <span>Full Contact</span>
                              {b.category?.weight && <span className="text-slate-600">·</span>}
                              {b.category?.weight && <span className="text-brand-400">{b.category.weight}</span>}
                              {b.category?.age && <span className="text-slate-600">·</span>}
                              {b.category?.age && <span>{b.category.age}</span>}
                            </p>
                          </div>
                        </div>
                        <StatusPill status={b.status} />
                      </div>

                      <div className="relative flex items-stretch gap-3 sm:gap-5">
                        <FighterCard reg={b.boxerAId} isWinner={isWinnerA} />

                        <div className="flex flex-col items-center justify-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/30">
                            VS
                          </span>
                        </div>

                        <FighterCard reg={b.boxerBId} isWinner={isWinnerB} />
                      </div>

                      {(b.status === 'completed' || b.status === 'walkover') && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <span className="rounded-full bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-white/10">
                            {b.status === 'walkover' && 'Walkover — '}
                            {b.result?.method || 'Decision'}
                            {b.result?.round ? ` · Round ${b.result.round}` : ''}
                          </span>
                          {hasBye && <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/80">Bye awarded</span>}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      )}

      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Powered by <span className="text-white">Bodymax</span> · Live event management
        </p>
      </footer>
    </div>
  )
}