import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'
import { StatusBadge } from '../../components/Badge.jsx'
import { Icon } from '../../components/Icons.jsx'
import { StatCard } from '../../components/StatCard.jsx'
import { AreaChart, BarList, DonutChart, RadialProgress, TrendChip } from '../../components/Charts.jsx'
import { cn } from '../../utils/cn.js'

const fmtDate = (iso) => {
  if (!iso) return 'Date TBD'
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const fmtShortDate = (iso) => {
  if (!iso) return 'Date TBD'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function daysUntil(iso) {
  if (!iso) return '—'
  const diff = Math.round((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  if (diff < 0) return 'Passed'
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `${diff} days`
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

function Panel({ title, subtitle, action, children, className, bodyClassName, delay = '' }) {
  return (
    <section className={cn('console-card animate-rise overflow-hidden', delay, className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName || 'p-5'}>{children}</div>
    </section>
  )
}

function MiniMetric({ label, value, hint, tone = 'text-slate-900' }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50/80 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        {hint && <p className="truncate text-[10px] text-slate-400">{hint}</p>}
      </div>
      <p className={cn('shrink-0 text-sm font-black', tone)}>{value}</p>
    </div>
  )
}

function GenderBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-800">
          {value} <span className="font-medium text-slate-400">· {pct}%</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function PromoterDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    api('/dashboard').then((d) => setData(d.dashboard)).catch(() => {})
  }, [])

  const a = data?.analytics || {}
  const trend = useMemo(() => (a.registrationTrend || []).map((m) => m.count), [a.registrationTrend])
  const trendLabels = useMemo(() => (a.registrationTrend || []).map((m) => m.label), [a.registrationTrend])

  if (!data) return <Loading label="Loading your command center..." />

  const firstName = user?.name?.split(' ')[0] || 'Manager'
  const statusData = (a.statusBreakdown || []).filter((s) => s.count > 0)
  const statusTotal = statusData.reduce((s, x) => s + x.count, 0)
  const weightData = (a.weightDistribution || []).map((w) => ({ label: w.label, value: w.count }))
  const topClubs = (a.topClubs || []).map((c) => ({ label: c.label, value: c.count }))
  const gender = a.genderSplit || { male: 0, female: 0, unspecified: 0 }
  const genderTotal = gender.male + gender.female + gender.unspecified
  const recent = a.recentActivity || []
  const events = data.events || []
  const hasPending = data.pendingRegistrations > 0 || data.pendingPayments > 0
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-brand-700 shadow-sm ring-1 ring-slate-200/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
            <span className="text-slate-300">/</span>
            <span>{today}</span>
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[32px]">
            {greeting()}, <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            Here is the live pulse of your events, boxers and registrations — everything you need to run the show.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/app/events"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Icon name="calendar" className="h-4 w-4 text-slate-400" />
            Event calendar
          </Link>
          <Link
            to="/app/events/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition hover:from-brand-700 hover:to-indigo-700 hover:shadow-brand-600/35"
          >
            <Icon name="plus" className="h-4 w-4" />
            New Event
          </Link>
        </div>
      </div>

      {/* Attention */}
      {hasPending && (
        <div className="animate-rise delay-1 relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50/60 to-white p-4 shadow-sm sm:p-5">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30">
                <Icon name="alert" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-amber-950">Action needed</p>
                <p className="text-xs text-amber-800/80">
                  {data.pendingRegistrations > 0 && (
                    <>
                      <span className="font-bold">{data.pendingRegistrations}</span> registration{data.pendingRegistrations === 1 ? '' : 's'} awaiting approval
                    </>
                  )}
                  {data.pendingRegistrations > 0 && data.pendingPayments > 0 && <span className="mx-1.5 text-amber-400">•</span>}
                  {data.pendingPayments > 0 && (
                    <>
                      <span className="font-bold">{data.pendingPayments}</span> payment{data.pendingPayments === 1 ? '' : 's'} to review
                    </>
                  )}
                </p>
              </div>
            </div>
            <Link
              to="/app/registrations"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-900"
            >
              Review now
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total registrations"
          value={data.registrationCount}
          sub={`${a.currentMonth ?? 0} this month`}
          trend={a.registrationGrowth}
          spark={trend}
          icon={<Icon name="registrations" className="h-5 w-5" />}
          tone="brand"
          to="/app/registrations"
          className="animate-rise delay-1"
        />
        <StatCard
          label="Active events"
          value={data.activeEvents}
          sub={`${data.openEvents} open · ${data.upcomingEvents} upcoming`}
          spark={[data.openEvents || 0, data.upcomingEvents || 0, data.activeEvents || 0, data.totalEvents || 0]}
          icon={<Icon name="events" className="h-5 w-5" />}
          tone="violet"
          to="/app/events"
          className="animate-rise delay-2"
        />
        <StatCard
          label="Eligible boxers"
          value={data.eligibleCount}
          sub={`${a.eligibleRate ?? 0}% ready for the draw`}
          spark={[0, data.weighedCount || 0, data.eligibleCount || 0]}
          icon={<Icon name="trophy" className="h-5 w-5" />}
          tone="emerald"
          to="/app/registrations"
          className="animate-rise delay-3"
        />
        <StatCard
          label="Pending reviews"
          value={data.pendingRegistrations}
          sub={`${data.pendingPayments} payment${data.pendingPayments === 1 ? '' : 's'} to check`}
          icon={<Icon name="alert" className="h-5 w-5" />}
          tone="amber"
          emphasis={data.pendingRegistrations > 0}
          to="/app/registrations"
          className="animate-rise delay-4"
        />
      </div>

      {/* Analytics */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          delay="delay-2"
          title="Registration activity"
          subtitle="Boxer entries over the last six months"
          action={
            <div className="flex items-center gap-2">
              <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 sm:inline">
                Last 6 months
              </span>
              <Link to="/app/registrations" className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-800">
                View all
                <Icon name="arrowUpRight" className="h-3.5 w-3.5" />
              </Link>
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[34px] font-black leading-none tracking-tight text-slate-900">{data.registrationCount}</p>
                <TrendChip value={a.registrationGrowth} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Total entries · <span className="font-semibold text-slate-700">{a.avgRegistrationsPerEvent ?? 0}</span> average per event
              </p>
            </div>
            <div className="flex items-center gap-5 text-right">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">This month</p>
                <p className="text-lg font-black text-slate-900">{a.currentMonth ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last month</p>
                <p className="text-lg font-black text-slate-500">{a.previousMonth ?? 0}</p>
              </div>
            </div>
          </div>
          {trend.length ? (
            <AreaChart values={trend} labels={trendLabels} height={220} valueSuffix=" entries" />
          ) : (
            <Empty title="No activity yet" message="Registration trends will appear here." />
          )}
        </Panel>

        <Panel
          delay="delay-3"
          title="Registration mix"
          subtitle="Where every boxer stands right now"
          action={<Icon name="pulse" className="h-4 w-4 text-slate-300" />}
        >
          <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
            <DonutChart data={statusData} centerValue={statusTotal} centerLabel="Entries" size={176} thickness={16} />
            <div className="w-full space-y-2.5">
              {(a.statusBreakdown || []).map((s) => {
                const pct = statusTotal ? Math.round((s.count / statusTotal) * 100) : 0
                return (
                  <div key={s.key} className="flex items-center gap-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-600">{s.label}</span>
                    <span className="text-[11px] font-bold text-slate-900">{s.count}</span>
                    <span className="w-8 text-right text-[10px] font-semibold text-slate-400">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
            <Link
              to="/app/registrations"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-slate-800"
            >
              Manage entries
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/app/events"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Events
            </Link>
          </div>
        </Panel>
      </div>

      {/* Distribution + readiness */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          delay="delay-3"
          title="Weight class distribution"
          subtitle="Where your registered boxers are competing"
          action={
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
              <Icon name="scale" className="h-3 w-3" />
              {weightData.length} classes
            </span>
          }
        >
          {weightData.length ? (
            <BarList data={weightData} color="#2563eb" valueSuffix=" boxers" />
          ) : (
            <Empty title="No weight data yet" message="Boxers will be grouped here once registrations arrive." />
          )}
          {a.ageDistribution?.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Age groups</span>
              {a.ageDistribution.map((g) => (
                <span key={g.label} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                  {g.label}
                  <span className="font-bold text-slate-900">{g.count}</span>
                </span>
              ))}
            </div>
          )}
        </Panel>

        <Panel delay="delay-4" title="Event readiness" subtitle="How close you are to fight night">
          <div className="flex items-center gap-4">
            <RadialProgress value={a.weighInProgress ?? 0} label="weighed" color="#7c3aed" size={124} stroke={10} />
            <div className="min-w-0 flex-1 space-y-2">
              <MiniMetric label="Weighed in" value={`${data.weighedCount}/${data.registrationCount}`} tone="text-violet-700" />
              <MiniMetric label="Eligible" value={data.eligibleCount} tone="text-emerald-700" />
              <MiniMetric label="Pending" value={data.pendingRegistrations} tone="text-amber-700" />
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gender split</p>
              <p className="text-[10px] font-semibold text-slate-400">{genderTotal} boxers</p>
            </div>
            <GenderBar label="Male" value={gender.male} total={genderTotal} color="#3b82f6" />
            <GenderBar label="Female" value={gender.female} total={genderTotal} color="#ec4899" />
            {gender.unspecified > 0 && <GenderBar label="Not specified" value={gender.unspecified} total={genderTotal} color="#94a3b8" />}
          </div>
        </Panel>
      </div>

      {/* Next event + top clubs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="animate-rise delay-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 p-6 text-white shadow-xl shadow-slate-900/10 lg:col-span-2">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '36px 36px' }}
          />
          {data.nextEvent ? (
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
                    <span className="h-1 w-1 rounded-full bg-brand-300" />
                    Next event
                  </p>
                  <h3 className="mt-2 max-w-xl truncate text-2xl font-black tracking-tight sm:text-3xl">{data.nextEvent.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="calendar" className="h-3.5 w-3.5" />
                      {fmtDate(data.nextEvent.eventDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="flag" className="h-3.5 w-3.5" />
                      {data.nextEvent.venue || 'Venue TBA'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="registrations" className="h-3.5 w-3.5" />
                      {data.nextEvent.registrationCount || 0} registered
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center backdrop-blur">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Countdown</p>
                  <p className="mt-0.5 text-lg font-black text-white">{daysUntil(data.nextEvent.eventDate)}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link
                  to={`/app/events/${data.nextEvent._id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  Open event
                  <Icon name="arrowUpRight" className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to={`/app/events/${data.nextEvent._id}/draws`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  Draw & bouts
                </Link>
                <Link
                  to={`/app/events/${data.nextEvent._id}/results`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  Results
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative flex min-h-[180px] flex-col items-start justify-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Next event</p>
              <h3 className="mt-2 text-2xl font-black">No event on the calendar</h3>
              <p className="mt-1 text-sm text-slate-400">Create your next tournament and start taking registrations.</p>
              <Link to="/app/events/new" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-slate-900">
                <Icon name="plus" className="h-3.5 w-3.5" />
                Create event
              </Link>
            </div>
          )}
        </div>

        <Panel
          delay="delay-5"
          title="Top clubs"
          subtitle="Most active this season"
          action={<Icon name="clubs" className="h-4 w-4 text-slate-300" />}
        >
          {topClubs.length ? (
            <BarList data={topClubs} color="#0f766e" valueSuffix="" />
          ) : (
            <Empty title="No clubs yet" message="Clubs will rank here as registrations come in." />
          )}
          <Link
            to="/app/clubs"
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
          >
            View all clubs
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </Panel>
      </div>

      {/* Events + activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          bodyClassName="p-0"
          delay="delay-5"
          title="Event performance"
          subtitle="Registrations, status and quick actions"
          action={
            <Link
              to="/app/events"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
            >
              All events
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {events.length === 0 ? (
            <Empty
              title="No events yet"
              message="Create your first event to get started."
              action={<Link to="/app/events/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-bold text-white">New Event</Link>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-2.5 font-bold">Event</th>
                    <th className="px-5 py-2.5 font-bold">Date</th>
                    <th className="px-5 py-2.5 font-bold">Entries</th>
                    <th className="px-5 py-2.5 font-bold">Status</th>
                    <th className="px-5 py-2.5 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {events.map((ev) => (
                    <tr key={ev._id} className="group transition hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <Link to={`/app/events/${ev._id}`} className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-[10px] font-black text-white shadow-sm">
                            {initials(ev.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[220px] truncate font-bold text-slate-900 group-hover:text-brand-700">{ev.name}</span>
                            <span className="block truncate text-[11px] text-slate-500">{ev.venue || 'Venue TBA'}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-600">{fmtShortDate(ev.eventDate)}</td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-slate-900">{ev.registrationCount}</span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={ev.registrationOpen ? 'open' : ev.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/app/events/${ev._id}/draws`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            Draws
                          </Link>
                          <Link
                            to={`/app/events/${ev._id}/results`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            Results
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          delay="delay-5"
          bodyClassName="p-0"
          title="Recent activity"
          subtitle="Latest entries across your events"
          action={<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Live</span>}
        >
          {recent.length === 0 ? (
            <Empty title="No activity yet" message="New registrations will appear here." />
          ) : (
            <ul className="divide-y divide-slate-50">
              {recent.map((r) => (
                <li key={r.id} className="flex items-start gap-3 px-5 py-3 transition hover:bg-slate-50/70">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-[10px] font-bold text-white">
                    {initials(r.boxer)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900">{r.boxer}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {r.club} · {r.event}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-[10px] font-medium text-slate-400">{timeAgo(r.createdAt)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 p-3">
            <Link
              to="/app/registrations"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Open registrations
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Panel>
      </div>

      {/* Footer insight strip */}
      <div className="animate-rise delay-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Clubs in network', value: data.clubCount, icon: 'clubs', tone: 'text-brand-600 bg-brand-50' },
          { label: 'Registered boxers', value: data.boxerCount, icon: 'boxers', tone: 'text-violet-600 bg-violet-50' },
          { label: 'Events this season', value: data.totalEvents, icon: 'events', tone: 'text-emerald-600 bg-emerald-50' },
          { label: 'Avg. entries per event', value: a.avgRegistrationsPerEvent ?? 0, icon: 'activity', tone: 'text-amber-600 bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className="console-card flex items-center gap-3 p-4">
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', s.tone)}>
              <Icon name={s.icon} className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-lg font-black leading-tight text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
