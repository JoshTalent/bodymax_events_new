import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { PublicNavbar, PublicFooter } from '../../components/PublicSite.jsx'
import { Icon } from '../../components/Icons.jsx'
import { cn } from '../../utils/cn.js'

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PublicBoxer() {
  const { id } = useParams()
  const [boxer, setBoxer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api(`/public-boxer?id=${id}`)
      .then((d) => setBoxer(d.boxer))
      .catch(() => setBoxer(null))
      .finally(() => setLoading(false))
  }, [id])

  const pro = boxer?.professional || {}
  const record = pro?.record || {}
  const wins = record.wins || 0
  const losses = record.losses || 0
  const draws = record.draws || 0
  const kos = record.koWins || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicNavbar />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Icon name="users" className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Loading boxer</h1>
          <PublicFooter />
        </div>
      </div>
    )
  }

  if (!boxer) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicNavbar />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Icon name="users" className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Boxer not found</h1>
          <p className="mt-2 text-slate-500">This professional boxer doesn't have a public profile yet.</p>
          <Link to="/events" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500">
            ← Back to events
          </Link>
          <PublicFooter />
        </div>
      </div>
    )
  }

  const hasPhoto = Boolean(pro?.photos?.headshotUrl)
  const hasFlag = Boolean(pro?.photos?.countryFlagUrl)
  const flagEmoji = pro?.countryCode
    ? String.fromCodePoint(127397 + pro.countryCode.toUpperCase().charCodeAt(0)) + String.fromCodePoint(127397 + pro.countryCode.toUpperCase().charCodeAt(1))
    : ''
  const country = pro?.country || pro?.nationality || boxer.nationality || '—'
  const stance = pro?.stance || '—'
  const height = pro?.heightCm ? `${pro.heightCm} cm` : '—'
  const reach = pro?.reachCm ? `${pro.reachCm} cm` : '—'
  const division = pro?.division || boxer.weightCategory || '—'
  const ringName = pro?.ringName || ''
  const nickname = pro?.nickname ? `"${pro.nickname}"` : ''

  const titleText = pro?.titles?.filter((t) => t.current).map((t) => t.title).join(', ') || '—'
  const sanctioning = pro?.titles?.filter((t) => t.current).map((t) => t.organisation).filter(Boolean).join(', ') || '—'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar />

      {/* Boxer hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            All events
          </Link>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-bold text-rose-300 ring-1 ring-inset ring-rose-500/30">
                  Professional
                </span>
                {pro?.division && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-white/5 px-3 py-1 text-[10px] font-semibold text-slate-200">
                    <Icon name="flag" className="h-3 w-3" />
                    {pro.division}
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                {boxer.fullName}
                {ringName && <span className="ml-2 text-[1.1em] italic text-rose-400">{ringName}</span>}
              </h1>
              {nickname && <p className="mt-1 text-[12px] text-slate-400 italic">{nickname}</p>}
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                {country && (
                  <span className="inline-flex items-center gap-1.5">
                    {hasFlag ? (
                      <img src={pro.photos.countryFlagUrl} alt={country} className="h-4 w-6 rounded-sm object-cover" />
                    ) : (
                      <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {country}
                  </span>
                )}
                {stance !== '—' && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {stance}
                  </span>
                )}
                {pro?.countryCode && (
                  <span className="inline-flex items-center gap-1.5">
                    {hasFlag ? (
                      <img src={pro.photos.countryFlagUrl} alt={country} className="h-4 w-6 rounded-sm object-cover" />
                    ) : (
                      <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18a8 8 0 100-16 8 8 0 000 16z" />
                      </svg>
                    )}
                    {pro.countryCode}
                    {flagEmoji && <span aria-hidden="true">{flagEmoji}</span>}
                  </span>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              {hasPhoto ? (
                <img
                  src={pro.photos.headshotUrl}
                  alt={boxer.fullName}
                  className="h-40 w-40 rounded-full object-cover border-4 border-white/10 shadow-2xl"
                />
              ) : (
                <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
                  <span className="text-slate-500">
                    {boxer.fullName.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Record chips */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            { label: 'Wins', value: wins, color: 'emerald' },
            { label: 'Losses', value: losses, color: 'rose' },
            { label: 'Draws', value: draws, color: 'slate' },
            { label: 'KOs', value: kos, color: 'amber' },
          ].map((c, i) => (
            <div key={c.label} className={cn('rounded-2xl border px-4 py-3 flex flex-col items-center', c.color === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : c.color === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-900' : c.color === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-900')}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{c.label}</p>
              <p className="mt-1 text-2xl font-black">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: record & titles */}
          <div className="lg:col-span-1 space-y-6">
            <Card title="Record">
              <div className="flex items-center justify-between text-3xl font-black text-slate-900">
                <span>{wins}</span>
                <span className="text-slate-400">–</span>
                <span>{losses}</span>
                <span className="text-slate-400">–</span>
                <span>{draws}</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">{kos} KO{wins === 1 ? '' : 's'} · {record.roundsBoxed || 0} rounds boxed</p>
              {record.debutDate && <p className="mt-1 text-[11px] text-slate-500">Pro debut {fmtDate(record.debutDate)}</p>}
            </Card>

            {titleText !== '—' && (
              <Card title="Current Titles">
                <p className="text-sm font-semibold text-slate-800">{titleText}</p>
                <p className="mt-1 text-[11px] text-slate-500">{sanctioning}</p>
              </Card>
            )}
          </div>

          {/* Middle: physical & team */}
          <div className="lg:col-span-1 space-y-6">
            <Card title="Physical">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Height</span>
                  <span className="font-semibold text-slate-900">{height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reach</span>
                  <span className="font-semibold text-slate-900">{reach}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stance</span>
                  <span className="font-semibold text-slate-900">{stance}</span>
                </div>
                {pro?.residence && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Residence</span>
                    <span className="font-semibold text-slate-900 truncate">{pro.residence}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Team">
              <div className="space-y-3 text-sm">
                {pro?.manager?.name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Manager</span>
                    <span className="font-semibold text-slate-900 truncate">{pro.manager.name}</span>
                  </div>
                )}
                {pro?.trainer?.name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trainer</span>
                    <span className="font-semibold text-slate-900 truncate">{pro.trainer.name}</span>
                  </div>
                )}
                {pro?.promoters?.length && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Promoter</span>
                    <span className="font-semibold text-slate-900 truncate">{pro.promoters.map((p) => p.company || p.name).join(', ')}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right: fight history */}
          <div className="lg:col-span-1 space-y-6">
            <Card title="Recent Fights">
              <div className="space-y-3">
                {(boxer.fights?.length ?? 0) > 0 ? (
                  boxer.fights.slice(0, 5).map((f) => (
                    <div key={f.eventId} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white/50 p-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{f.eventName || 'Event'}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{fmtDate(f.eventDate)}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600">
                        {f.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-4">No fight history yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</h3>
      {children}
    </div>
  )
}
