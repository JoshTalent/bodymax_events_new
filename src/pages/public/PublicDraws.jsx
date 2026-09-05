import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'
import { LanguageModal } from '../../components/LanguageModal.jsx'
import { cn } from '../../utils/cn.js'
import { getSavedLang, persistLang } from '../../utils/language.js'

const text = {
  en: {
    officialDraw: 'Official Draw',
    tagline: 'Live fight card · read only',
    bouts: 'Bouts',
    venue: 'Venue',
    location: 'Location',
    date: 'Date',
    tbd: 'TBD',
    boutOrder: 'Bout Order',
    autoUpdate: 'Results update automatically',
    noBoutsYet: 'No bouts announced yet',
    noBoutsBody: 'The draw is being finalised. Please check back soon.',
    allWeights: 'All weights',
    bye: 'Bye — no opponent',
    individual: 'Individual',
    winner: 'Winner',
    walkoverNoOpponent: 'Walkover — opponent unavailable.',
    result: 'Result',
    schedule: 'Scheduled',
    ready: 'Ready',
    inProgress: 'In Progress',
    walkover: 'Walkover',
    completed: 'Completed',
    postponed: 'Postponed',
    cancelled: 'Cancelled',
    errorBack: 'Back to home',
    footerBy: 'Powered by',
    footerTag: 'Live event management',
  },
  rw: {
    officialDraw: 'Urukurikirane rw’imikino',
    tagline: 'Imikino iriho · gusoma gusa',
    bouts: 'Imikino',
    venue: 'Aho bizobera',
    location: 'Aho biherereye',
    date: 'Itariki',
    tbd: 'Rizamenyeshwa',
    boutOrder: 'Urukurikirane rw’imikino',
    autoUpdate: 'Ibyavuye bihita bigaragara',
    noBoutsYet: 'Nta mikino imenyekanishwa',
    noBoutsBody: 'Urukurikirane ruravuza. Ngaruka nyuma.',
    allWeights: 'Uburemere bwose',
    bye: 'Bye — nta mukunywanyi',
    individual: 'Ku giti cye',
    winner: 'Uwayitsinze',
    walkoverNoOpponent: 'Walkover — umukunywanyi ntabonetse.',
    result: 'Ibyavuye',
    schedule: 'Iteganijwe',
    ready: 'Yiteguye',
    inProgress: 'Iri gukorwa',
    walkover: 'Walkover',
    completed: 'Byarangiye',
    postponed: 'Byimuwe',
    cancelled: 'Byahanuwe',
    errorBack: 'Subira ahabanza',
    footerBy: 'Yatanzwe na',
    footerTag: 'Gucunga ibirori',
  },
}

function StatusPill({ status, t }) {
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
    scheduled: t.schedule,
    ready: t.ready,
    in_progress: t.inProgress,
    walkover: t.walkover,
    completed: t.completed,
    postponed: t.postponed,
    cancelled: t.cancelled,
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', map[status] || 'bg-slate-100 text-slate-600 ring-slate-200')}>
      {label[status] || status.replace('_', ' ')}
    </span>
  )
}

function Fighter({ reg, isWinner, t }) {
  const n = reg?.boxerId?.fullName
  const c = reg?.clubName || reg?.boxerId?.clubName || reg?.clubId?.name || ''

  if (!n) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
        <span className="text-sm italic text-slate-400">{t.bye}</span>
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
        <span className="block truncate text-sm text-slate-500">{c || t.individual}</span>
      </span>
      {isWinner && (
        <span className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">{t.winner}</span>
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
  const [lang, setLang] = useState(getSavedLang() || 'en')
  const [showLang, setShowLang] = useState(!getSavedLang())
  const t = lang === 'rw' ? text.rw : text.en

  const chooseLang = (code) => {
    persistLang(code)
    setLang(code)
    setShowLang(false)
  }

  useEffect(() => {
    api(`/draws/public?token=${encodeURIComponent(token)}`)
      .then((d) => {
        setEvent(d.event)
        setBouts(d.bouts || [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <>
      <Loading />
      <LanguageModal open={showLang} onSelect={chooseLang} />
    </>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-950">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white">B</span>
            <span className="text-lg font-bold text-white">Bodymax</span>
          </Link>
          <div className="flex items-center gap-3">
            {event?.eventDate && (
              <span className="hidden text-xs font-medium text-slate-400 sm:block">
                {new Date(event.eventDate).toLocaleDateString(lang === 'rw' ? 'rw-RW' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            <div className="flex items-center rounded-full bg-white/10 p-0.5 ring-1 ring-white/20">
              {(['en', 'rw']).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => chooseLang(code)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold transition',
                    lang === code ? 'bg-white text-slate-900' : 'text-slate-200 hover:text-white'
                  )}
                >
                  {code === 'en' ? 'EN' : 'Kinyarwanda'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-slate-500">{error}</p>
          <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">← {t.errorBack}</Link>
        </div>
      ) : (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          {/* Hero */}
          <section className="overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
            <div className="bg-[radial-gradient(60%_120%_at_100%_0%,rgba(59,130,246,0.25),transparent)] px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">{t.officialDraw}</p>
                  <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{event?.name}</h1>
                  <p className="mt-1 text-sm text-slate-400">{t.tagline}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-white px-5 py-3 text-center shadow-lg">
                    <p className="text-2xl font-bold text-slate-900">{bouts.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.bouts}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
                <InfoRow icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>} label={t.venue} value={event?.venue} />
                <InfoRow icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>} label={t.location} value={event?.location} />
                <InfoRow icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>} label={t.date} value={event?.eventDate ? new Date(event.eventDate).toLocaleDateString(lang === 'rw' ? 'rw-RW' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : t.tbd} />
              </div>
            </div>
          </section>

          {/* Bout list */}
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{t.boutOrder}</h2>
              <span className="text-xs font-medium text-slate-500">{t.autoUpdate}</span>
            </div>

            {bouts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{t.noBoutsYet}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.noBoutsBody}</p>
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
                              {b.category?.weight || t.allWeights}
                              {b.category?.age ? ` · ${b.category.age}` : ''}
                            </p>
                          </div>
                        </div>
                        <StatusPill status={b.status} t={t} />
                      </div>

                      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                        <Fighter reg={b.boxerAId} isWinner={isWinnerA} t={t} />
                        <span className="self-center flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold uppercase text-white sm:mx-1">
                          vs
                        </span>
                        <Fighter reg={b.boxerBId} isWinner={isWinnerB} t={t} />
                      </div>

                      {(b.status === 'completed' || b.status === 'walkover') && (
                        <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          {b.status === 'walkover' && hasBye
                            ? t.walkoverNoOpponent
                            : `${t.result}: ${b.result?.method || 'Decision'}${b.result?.round ? ` · Round ${b.result.round}` : ''}`}
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
          {t.footerBy} <span className="text-slate-700">Bodymax</span> · {t.footerTag}
        </p>
      </footer>

      <LanguageModal open={showLang} onSelect={chooseLang} />
    </div>
  )
}