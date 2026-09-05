import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'
import { cn } from '../../utils/cn.js'

function StatusPill({ status }) {
  const map = {
    scheduled: 'bg-blue-100 text-blue-800',
    ready: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-amber-100 text-amber-800',
    walkover: 'bg-amber-100 text-amber-800',
    completed: 'bg-emerald-100 text-emerald-800',
    postponed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-slate-100 text-slate-600',
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
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', map[status] || 'bg-slate-100 text-slate-700')}>
      {label[status] || status.replace('_', ' ')}
    </span>
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

  const name = (r) => r?.boxerId?.fullName
  const club = (r) => r?.clubName || r?.boxerId?.clubName || r?.clubId?.name || ''

  const slot = (reg) => {
    const n = name(reg)
    const c = club(reg)
    return (
      <div className={cn(
        'flex flex-1 items-center gap-3 rounded-xl border px-3 py-2',
        n ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50'
      )}>
        {n ? (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {n.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">{n}</span>
              {c && <span className="block truncate text-xs text-slate-500">{c}</span>}
            </span>
          </>
        ) : (
          <span className="w-full text-center text-sm italic text-slate-400">Bye</span>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-slate-900">Bodymax</Link>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Official Draw</span>
        </div>
      </header>

      {error ? (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-slate-500">{error}</p>
          <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">← Back to home</Link>
        </div>
      ) : (
        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">{event?.name}</h1>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">Venue</p>
                <p className="text-slate-900">{event?.venue || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Location</p>
                <p className="text-slate-900">{event?.location || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Date</p>
                <p className="text-slate-900">
                  {event?.eventDate ? new Date(event.eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Draw & Bout Order</h2>
              <p className="text-sm text-slate-500">Official pairing list — read only</p>
            </div>

            {bouts.length === 0 ? (
              <p className="px-6 py-10 text-center text-slate-500">No bouts announced yet. Check back soon.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {bouts.map((b, i) => {
                  return (
                    <li key={b._id} className="px-6 py-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-bold text-white">{i + 1}</span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bout #{b.boutNumber}</p>
                            <p className="text-xs text-slate-500">
                              {b.category?.weight || 'All weights'}
                              {b.category?.age ? ` · ${b.category.age}` : ''}
                              {b.category?.gender ? ` · ${b.category.gender}` : ''}
                            </p>
                          </div>
                        </div>
                        <StatusPill status={b.status} />
                      </div>
                      <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                        {slot(b.boxerAId)}
                        <span className="px-1 text-center text-xs font-bold uppercase tracking-widest text-slate-300">vs</span>
                        {slot(b.boxerBId)}
                      </div>
                      {(b.status === 'completed' || b.status === 'walkover') && (
                        <p className="mt-2 text-xs text-emerald-700">
                          Result: {b.result?.method || (b.status === 'walkover' ? 'Walkover' : 'Decision')}
                          {b.result?.round ? ` · ${b.result.round}` : ''}
                          {b.result?.notes ? ` — ${b.result.notes}` : ''}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </main>
      )}
    </div>
  )
}