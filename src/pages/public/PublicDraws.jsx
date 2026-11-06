import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'
import { LanguageModal } from '../../components/LanguageModal.jsx'
import { Icon } from '../../components/Icons.jsx'
import { RadialProgress, BarList } from '../../components/Charts.jsx'
import { Logo } from '../../components/Logo.jsx'
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
    redCorner: 'Red Corner',
    blueCorner: 'Blue Corner',
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
    liveNow: 'Live now',
    nextUp: 'Next up',
    mainEvent: 'Main event',
    fightCard: 'Fight card',
    cardProgress: 'Card progress',
    weightClasses: 'Weight classes',
    record: 'Record',
    yrs: 'yrs',
    remaining: 'Remaining',
    liveUpdates: 'Live updates',
    liveUpdatesBody:
      'This card refreshes automatically as officials record results. No account is needed — share the link with anyone who wants to follow the action.',
    officialBadge: 'Official card',
    readOnly: 'Read-only',
    complete: 'complete',
    boutOf: 'Bout {n} of {total}',
    cardLocked: 'Card finalised',
    male: 'Male',
    female: 'Female',
  },
  rw: {
    officialDraw: 'Urutonde rw’imikino',
    tagline: 'Imikino iriho ',
    bouts: 'Imikino',
    venue: 'Aho bizabera',
    location: 'Aho biherereye',
    date: 'Itariki',
    tbd: 'Rizamenyeshwa',
    boutOrder: 'Urutonde rw’imikino',
    autoUpdate: 'Ibyabaye bihita bigaragara',
    noBoutsYet: 'Nta mikino imenyekanishwa',
    noBoutsBody: 'Urukurikirane ruravuza. Ngaruka nyuma.',
    allWeights: 'ibiro bwose',
    bye: 'Bye — nta mukunywanyi',
    individual: 'Ku giti cye',
    redCorner: 'Impande Itukura',
    blueCorner: 'Impande Yubururu',
    winner: 'Uwayitsinze',
    walkoverNoOpponent: 'Walkover — umukunywanyi ntabonetse.',
    result: 'Ibyavuyemo',
    schedule: 'Iteganijwe',
    ready: 'Yiteguye',
    inProgress: 'Iri gukorwa',
    walkover: 'Walkover',
    completed: 'Byarangiye',
    postponed: 'Byimuwe',
    cancelled: 'Byahagaritswe',
    errorBack: 'Subira ahabanza',
    footerBy: 'Yatanzwe na',
    footerTag: 'Gucunga ibirori',
    liveNow: 'Biri gukorwa',
    nextUp: 'Bikurikira',
    mainEvent: 'Umukino nyamukuru',
    fightCard: 'Urutonde rw’imikino',
    cardProgress: 'Aho urutonde rugeze',
    weightClasses: 'Ibyiciro by’ibiro',
    record: 'Ibisubizo',
    yrs: 'imyaka',
    remaining: 'Bisigaye',
    liveUpdates: 'Amakuru ahita',
    liveUpdatesBody:
      'Uru rutonde ruvugururwa ubwo bumwe iyo abacamanza bandika ibisubizo. Nta konti ikenewe — sangiza umurongo uwo ari we wese ushaka gukurikirana imikino.',
    officialBadge: 'Urutonde rwemewe',
    readOnly: 'Gusoma gusa',
    complete: 'byarangiye',
    boutOf: 'Umukino {n} kuri {total}',
    cardLocked: 'Urutonde rwarangiye',
    male: 'Gabo',
    female: 'Gore',
  },
}

const fmtDate = (iso, lang, opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  if (lang === 'rw') {
    const parts = []
    if (opts.weekday) parts.push(RW_DAYS[d.getDay()])
    if (opts.day) parts.push(String(d.getDate()))
    if (opts.month) parts.push(RW_MONTHS[d.getMonth()])
    if (opts.year) parts.push(String(d.getFullYear()))
    return parts.join(' ')
  }
  try {
    return d.toLocaleDateString('en-GB', opts)
  } catch {
    return d.toLocaleDateString('en-GB')
  }
}

const RW_MONTHS = [
  'Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena',
  'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza',
]
const RW_DAYS = [
  'Ku cyumweru', 'Kuwa mbere', 'Kuwa kabiri', 'Kuwa gatatu',
  'Kuwa kane', 'Kuwa gatanu', 'Kuwa gatandatu',
]

const initialsOf = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'

function ageFrom(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const monthDiff = now.getMonth() - d.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age -= 1
  return age > 0 && age < 120 ? age : null
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
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset',
        map[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
      )}>
      {status === 'in_progress' && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
      )}
      {label[status] || (status || '').replace('_', ' ')}
    </span>
  )
}

function Corner({ corner, reg, isWinner, featured = false, t }) {
  const isRed = corner === 'red'
  const name = reg?.boxerId?.fullName
  const club = reg?.clubName || reg?.boxerId?.clubName || reg?.clubId?.name || ''
  const boxer = reg?.boxerId || {}
  const rec = boxer.boxingRecord
  const hasRecord = rec && (Number(rec.wins) || 0) + (Number(rec.losses) || 0) + (Number(rec.draws) || 0) > 0
  const age = ageFrom(boxer.dateOfBirth)

  if (!name) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4 text-center',
          featured ? 'min-h-[150px] w-full' : 'min-h-[100px] flex-1'
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{isRed ? t.redCorner : t.blueCorner}</span>
        <span className="mt-1 text-xs font-semibold italic text-slate-400">{t.bye}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex items-center overflow-hidden rounded-2xl border',
        featured
          ? 'min-h-[160px] w-full gap-4 px-4 py-5 sm:min-h-[190px] sm:gap-6 sm:px-7 sm:py-6'
          : 'min-h-[100px] flex-1 gap-3 px-3 py-3 sm:px-4',
        isWinner
          ? 'border-emerald-300 bg-emerald-50/80 ring-1 ring-emerald-200'
          : isRed
            ? 'border-red-200 bg-gradient-to-br from-red-50/80 to-white'
            : 'border-blue-200 bg-gradient-to-br from-blue-50/80 to-white'
      )}
    >
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          isWinner ? 'bg-emerald-500' : isRed ? 'bg-red-500' : 'bg-blue-500'
        )}
      />
      {boxer.photoUrl ? (
        <img
          src={boxer.photoUrl}
          alt={name}
          className={cn(
            'shrink-0 rounded-xl object-cover object-top shadow-lg',
            featured ? 'h-28 w-28 ring-4 sm:h-36 sm:w-36' : 'h-14 w-14 ring-2 sm:h-16 sm:w-16',
            isWinner ? 'ring-emerald-300' : isRed ? 'ring-red-200' : 'ring-blue-200'
          )}
        />
      ) : (
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl font-black text-white shadow-lg',
            featured ? 'h-28 w-28 text-3xl ring-4 ring-white sm:h-36 sm:w-36 sm:text-4xl' : 'h-14 w-14 text-[12px] sm:h-16 sm:w-16',
            isWinner
              ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
              : isRed
                ? 'bg-gradient-to-br from-red-500 to-red-800'
                : 'bg-gradient-to-br from-blue-500 to-blue-900'
          )}>
          {initialsOf(name)}
        </span>
      )}

      <div className={cn('min-w-0 flex-1', featured ? 'space-y-1.5' : 'space-y-1')}>
        <p className={cn('font-bold uppercase tracking-[0.16em] text-slate-400', featured ? 'text-[10px] sm:text-xs' : 'text-[9px]')}>
          {isRed ? t.redCorner : t.blueCorner}
        </p>
        <p className={cn('font-black leading-tight text-slate-900', featured ? 'break-words text-xl sm:text-3xl' : 'truncate text-sm sm:text-[15px]')}>
          {name}
        </p>
        {isWinner && (
          <p className={cn('font-semibold uppercase tracking-wider text-emerald-600', featured ? 'text-xs sm:text-sm' : 'text-xs')}>
            {t.winner}
          </p>
        )}
        <p className={cn('text-slate-500', featured ? 'text-xs sm:text-sm' : 'text-[10px]')}>{club || t.individual}</p>
        {hasRecord && (
          <p className={cn('font-semibold text-slate-600', featured ? 'text-xs sm:text-sm' : 'text-[10px]')}>
            {rec.wins}W {rec.losses}L {rec.draws}D
          </p>
        )}
        {age && (
          <p className={cn('text-slate-500', featured ? 'text-xs sm:text-sm' : 'text-[10px]')}>{age} {t.yrs}</p>
        )}
        {boxer.nationality && (
          <p className={cn('text-slate-500', featured ? 'text-xs sm:text-sm' : 'text-[10px]')}>{boxer.nationality}</p>
        )}
      </div>
    </div>
  )
}

function BoutCard({ bout, index, total, isMain, isNext, hasLive, t }) {
  const winnerRegId =
    bout.winnerId && typeof bout.winnerId === 'object' ? bout.winnerId._id : bout.winnerId
  const isWinnerA = winnerRegId && String(winnerRegId) === String(bout.boxerAId?._id)
  const isWinnerB = winnerRegId && String(winnerRegId) === String(bout.boxerBId?._id)
  const hasBye = !bout.boxerAId || !bout.boxerBId
  const isLive = bout.status === 'in_progress'
  const isDone = bout.status === 'completed' || bout.status === 'walkover'
  const resultRecorded = !!bout.winnerId
  const format = [
    bout.numberOfRounds ? `${bout.numberOfRounds}R` : null,
    bout.minutesPerRound ? `${bout.minutesPerRound} min` : null,
  ]
    .filter(Boolean)
    .join(' × ')

  // When a result is recorded only the winner is shown, in a full-width showcase.
  const winnerReg = isWinnerA ? bout.boxerAId : isWinnerB ? bout.boxerBId : null

  const tags = []
  if (isLive) tags.push({ label: t.liveNow, cls: 'bg-amber-500 text-white', pulse: true })
  if (isMain) tags.push({ label: t.mainEvent, cls: 'bg-slate-900 text-white' })
  if (!hasLive && isNext && !isMain) tags.push({ label: t.nextUp, cls: 'bg-brand-600 text-white' })

  const rail = isLive
    ? 'bg-amber-400'
    : bout.status === 'completed'
      ? 'bg-emerald-400'
      : isDone
        ? 'bg-emerald-300'
        : hasBye
          ? 'bg-slate-300'
          : 'bg-brand-400'

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition sm:rounded-3xl',
        isLive
          ? 'border-amber-300 shadow-[0_18px_45px_-30px_rgba(245,158,11,0.9)] ring-2 ring-amber-200/70'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]'
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', rail)} />

      <div className="px-4 py-4 pl-5 sm:px-6 sm:py-5 sm:pl-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-sm">
              {bout.boutNumber ?? index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {t.boutOf.replace('{n}', bout.boutNumber ?? index + 1).replace('{total}', total)}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {bout.category?.weight || t.allWeights}
                </span>
                {bout.category?.age && (
                  <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                    {bout.category.age}
                  </span>
                )}
                {bout.category?.gender && (
                  <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                    {bout.category.gender === 'M' ? t.male : bout.category.gender === 'F' ? t.female : bout.category.gender}
                  </span>
                )}
                {format && (
                  <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {format}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] shadow-sm',
                  tag.cls
                )}
              >
                {tag.pulse && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                )}
                {tag.label}
              </span>
            ))}
            <StatusPill status={bout.status} t={t} />
          </div>
        </div>

        {resultRecorded ? (
          // Result recorded: show the winner alone, large enough to fill the card.
          <div className="mt-4">
            <Corner
              corner={isWinnerB ? 'blue' : 'red'}
              reg={winnerReg || bout.boxerAId || bout.boxerBId}
              isWinner
              featured
              t={t}
            />
          </div>
        ) : (
          // No result yet: both boxers side by side with the VS badge between them.
          <div className="mt-4 flex items-stretch gap-2 sm:gap-3">
            {bout.boxerAId && <Corner corner="red" reg={bout.boxerAId} isWinner={false} t={t} />}
            {!hasBye && (
              <div className="flex shrink-0 items-center justify-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black uppercase tracking-wide text-white shadow-sm ring-4 ring-white">
                  vs
                </span>
              </div>
            )}
            {bout.boxerBId && <Corner corner="blue" reg={bout.boxerBId} isWinner={false} t={t} />}
          </div>
        )}
      </div>
    </article>
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
    let active = true
    let hasData = false

    const load = () =>
      api(`/draws/public?token=${encodeURIComponent(token)}`)
        .then((d) => {
          if (!active) return
          hasData = true
          setEvent(d.event)
          setBouts(d.bouts || [])
          setError('')
        })
        .catch((e) => {
          if (!active || hasData) return
          setError(e.message)
        })
        .finally(() => {
          if (active) setLoading(false)
        })

    load()
    // Keep the public card in sync while officials record results.
    const timer = setInterval(() => {
      if (!document.hidden) load()
    }, 30000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [token])

  if (loading) return (
    <>
      <Loading />
      <LanguageModal open={showLang} onSelect={chooseLang} />
    </>
  )

  const visible = (bouts || []).filter(
    (b) => !!(b.boxerAId?.boxerId?.fullName) || !!(b.boxerBId?.boxerId?.fullName)
  )
  const total = visible.length
  const completed = visible.filter((b) => ['completed', 'walkover'].includes(b.status)).length
  const live = visible.filter((b) => b.status === 'in_progress').length
  const remaining = Math.max(total - completed - live, 0)
  const progress = total ? Math.round((completed / total) * 100) : 0

  const liveBout = visible.find((b) => b.status === 'in_progress')
  const nextBout = visible.find((b) => !['completed', 'walkover', 'in_progress', 'cancelled'].includes(b.status))
  const mainBout = visible[visible.length - 1]

  const classCounts = visible.reduce((acc, b) => {
    const key = b.category?.weight || t.allWeights
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const classData = Object.entries(classCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const eventDateLong = fmtDate(event?.eventDate, lang)
  const eventDateShort = fmtDate(event?.eventDate, lang, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <Logo className="h-9 w-9 shrink-0 rounded-xl" />
            <span className="min-w-0 leading-none">
              <span className="block truncate text-lg font-black tracking-tight text-white">Bodymax</span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">{t.officialBadge}</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {eventDateShort && (
              <span className="hidden items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-slate-300 ring-1 ring-inset ring-white/10 sm:inline-flex">
                <Icon name="calendar" className="h-3.5 w-3.5 text-slate-500" />
                {eventDateShort}
              </span>
            )}
            <div className="flex items-center rounded-full bg-white/10 p-0.5 ring-1 ring-inset ring-white/15">
              {(['en', 'rw']).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => chooseLang(code)}
                  className={cn(
                    'rounded-full px-3 py-1 text-[11px] font-bold transition',
                    lang === code ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                  )}>
                    {code === 'en' ? 'EN' : 'RW'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

      {error ? (
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Icon name="alert" className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-700">{error}</p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800">
              <Icon name="chevronRight" className="h-3.5 w-3.5 rotate-180" />
              {t.errorBack}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Hero */}
          <section className="relative overflow-hidden border-b border-white/5 bg-slate-950 text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
              }}
            />
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-11">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300 ring-1 ring-inset ring-white/10">
                  <Icon name="trophy" className="h-3.5 w-3.5 text-brand-400" />
                  {t.officialDraw}
                </span>
                {live > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300 ring-1 ring-inset ring-amber-400/30">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                    </span>
                    {t.liveNow}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 ring-1 ring-inset ring-white/10">
                    {t.readOnly} · {t.autoUpdate}
                  </span>
                )}
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                {event?.name}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-400">{t.tagline}</p>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-300 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" className="h-4 w-4 text-slate-500" />
                  {eventDateLong || t.tbd}
                </span>
                {event?.venue && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="flag" className="h-4 w-4 text-slate-500" />
                    {event.venue}
                  </span>
                )}
                {event?.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="globe" className="h-4 w-4 text-slate-500" />
                    {event.location}
                  </span>
                )}
              </div>

              <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { label: t.bouts, value: total },
                  { label: t.completed, value: completed },
                  { label: t.liveNow, value: live, live: live > 0 },
                  { label: t.weightClasses, value: classData.length },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={cn(
                      'rounded-2xl border px-4 py-3 backdrop-blur-sm',
                      s.live ? 'border-amber-400/30 bg-amber-400/10' : 'border-white/[0.08] bg-white/[0.045]'
                    )}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{s.label}</p>
                    <p className={cn('mt-1 text-xl font-black leading-none', s.live ? 'text-amber-300' : 'text-white')}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              {/* Fight card */}
              <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900">
                      <Icon name="trophy" className="h-4 w-4 text-slate-400" />
                      {t.fightCard}
                    </h2>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                      {total} {t.bouts.toLowerCase()} · {t.boutOrder}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t.autoUpdate}
                  </span>
                </div>

                {visible.length === 0 ? (
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-sm">
                    <div className="relative px-6 py-14">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_65%)]" />
                      <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/20">
                        <Icon name="trophy" className="h-6 w-6" />
                      </span>
                      <h3 className="relative mt-4 text-lg font-black text-slate-900">{t.noBoutsYet}</h3>
                      <p className="relative mx-auto mt-1 max-w-sm text-sm text-slate-500">{t.noBoutsBody}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {visible.map((b, i) => (
                      <BoutCard
                        key={b._id}
                        bout={b}
                        index={i}
                        total={total}
                        isMain={mainBout?._id === b._id}
                        isNext={nextBout?._id === b._id}
                        hasLive={!!liveBout}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Side rail */}
              <aside className="space-y-3 sm:space-y-4 lg:sticky lg:top-20">
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-4 py-3.5">
                    <h3 className="text-sm font-bold text-slate-900">{t.cardProgress}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {completed}/{total} {t.completed.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 px-4 py-4">
                    <RadialProgress value={progress} label={t.complete} size={104} stroke={9} color="#2563eb" />
                    <div className="min-w-0 flex-1">
                      <span className="text-emerald-600 font-bold text-sm">{completed}</span>
                      <span className="mx-2 text-amber-600 font-bold text-sm">{live}</span>
                      <span className="text-slate-600 font-bold text-sm">{remaining}</span>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </section>

                {classData.length > 0 && (
                  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3.5">
                      <h3 className="text-sm font-bold text-slate-900">{t.weightClasses}</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500">{t.distribution}</p>
                    </div>
                    <div className="px-4 pb-4">
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </section>
                )}

                <section className="overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-950 p-4 text-white shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-300 ring-1 ring-inset ring-white/10">
                      <Icon name="pulse" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">{t.liveUpdates}</h3>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{t.liveUpdatesBody}</p>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </main>

          <footer className="border-t border-slate-200 bg-white py-8">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Logo className="h-7 w-7" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  {t.footerBy} <span className="text-slate-700">Bodymax</span> · {t.footerTag}
                </p>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{t.autoUpdate}</p>
            </div>
          </footer>

          <LanguageModal open={showLang} onSelect={chooseLang} />
        </>
      )}
    </div>
  )
}