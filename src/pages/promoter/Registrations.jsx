import { Fragment, useEffect, useMemo, useState } from 'react'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { StatusBadge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Textarea, Select } from '../../components/Field.jsx'
import { cn } from '../../utils/cn'

const ROW_PILLS = {
  pending_approval: { label: 'Pending Approval', cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  needs_correction: { label: 'Needs Correction', cls: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  payment_confirmed: { label: 'Payment Confirmed', cls: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  eligible: { label: 'Eligible', cls: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  withdrawn: { label: 'Withdrawn', cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
}

const ACTIONABLE = ['pending_approval', 'needs_correction']

const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-slate-700 to-slate-900',
  'bg-gradient-to-br from-blue-600 to-indigo-700',
  'bg-gradient-to-br from-emerald-600 to-teal-700',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
  'bg-gradient-to-br from-violet-600 to-purple-700',
]

function initials(name = '') {
  return (
    name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

function avatarGradient(name = '') {
  let h = 0
  for (const c of name) h = (h + c.charCodeAt(0)) % 997
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length]
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateShort(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function thankYouMessage(r) {
  const boxer = r.boxerId?.fullName || 'your boxer'
  const event = r.eventId?.name || 'our event'
  const date = r.eventId?.eventDate
    ? new Date(r.eventId.eventDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const gender = r.category?.gender === 'M' ? 'Male' : r.category?.gender === 'F' ? 'Female' : ''
  const cat = []
  if (r.category?.weight) cat.push(`Weight: ${r.category.weight}`)
  if (r.category?.age) cat.push(`Age: ${r.category.age}`)
  if (gender) cat.push(`Gender: ${gender}`)
  return [
    `Hello ${r.clubName || 'the club'},`,
    `Thank you for registering ${boxer} for ${event}${date ? ` on ${date}` : ''}.`,
    'Here are the details of the boxer added:',
    `• Name: ${boxer}`,
    ...cat.map((c) => `• ${c}`),
    `• Bouts: ${r.numberOfBouts || 1}`,
    'We will review and confirm the entry. Best regards, Bodymax Events Team',
  ].join('\n')
}

function waNumber(digits = '') {
  let d = digits.replace(/[^0-9]/g, '')
  if (d.startsWith('250')) return d
  if (d.startsWith('0')) return '250' + d.slice(1)
  if (d.startsWith('7')) return '250' + d
  return d
}

function waUrl(r) {
  const number = waNumber(r.whatsapp)
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(thankYouMessage(r))}`
}

function StatusPill({ status }) {
  const cfg = ROW_PILLS[status]
  if (!cfg) return <StatusBadge status={status} />
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', cfg.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

function Icon({ name, className }) {
  const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'layers':
      return (
        <svg {...common} strokeWidth={1.6}>
          <path d="M12 2l8.5 4.5L12 11 3.5 6.5 12 2z" />
          <path d="M3.5 11.5L12 16l8.5-4.5" />
          <path d="M3.5 16.5L12 21l8.5-4.5" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="M9 12.5l2.2 2.2L15.5 10" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 9v4" />
          <path d="M12 16.5h.01" />
          <path d="M10.3 3.5L2.6 17.5a2 2 0 001.75 3h15.3a2 2 0 001.75-3L13.7 3.5a2 2 0 00-3.4 0z" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M4 21h16" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 10-2.3 5.7" />
          <path d="M20 4v7h-7" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12.04 2a9.9 9.9 0 00-8.5 14.94L2 22l5.2-1.5a9.9 9.9 0 004.84 1.24h.01A9.9 9.9 0 1012.04 2zm5.8 14.06c-.25.7-1.44 1.34-2 1.4-.52.06-1.16.09-1.87-.12-1.87-.6-3.81-2.95-4.34-3.52-.53-.57-1.77-2.05-1.77-3.91 0-1.86.97-2.78 1.32-3.16.35-.37.76-.46 1.01-.46.25 0 .51 0 .73.01.23.01.56-.09.85.65.32.83 1.09 2.87 1.13 3.08.05.21.08.45-.04.71-.11.26-.17.42-.33.65-.17.22-.36.5-.5.67-.17.17-.35.35-.15.7.2.34.88 1.45 1.9 2.35 1.3 1.16 1.78 1.37 2.05 1.45.25.08.4.07.55-.04.16-.12.63-.74.8-1 .17-.25.34-.21.57-.13.25.08 1.53.72 1.79.85.26.13.43.2.5.3.06.1.06.6-.19 1.29z" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common}>
          <path d="M3 6.5a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2v-11z" />
          <path d="M3.5 7l7 5.5 7-5.5" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
          <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      )
    case 'flag':
      return (
        <svg {...common}>
          <path d="M5 21V4" />
          <path d="M5 4h13l-2.5 4L18 12H5" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )
    default:
      return null
  }
}

const normGender = (g) => {
  if (g === 'M') return 'Male'
  if (g === 'F') return 'Female'
  if (g === 'Mixed') return 'Mixed'
  return g || ''
}

const categoryLabel = (r) => {
  const parts = []
  if (r.category?.age) parts.push(r.category.age)
  if (r.category?.weight) parts.push(r.category.weight)
  if (r.category?.gender) parts.push(r.category.gender === 'Mixed' ? 'Mixed' : r.category.gender)
  return parts
}

const csvEscape = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function Registrations() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [regs, setRegs] = useState(null)
  const [eventFilter, setEventFilter] = useState('all')
  const [weightFilter, setWeightFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [boutsFilter, setBoutsFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [busyLoad, setBusyLoad] = useState(false)
  const [actionReg, setActionReg] = useState(null)
  const [action, setAction] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteBoxer, setDeleteBoxer] = useState(null)
  const [busyDelete, setBusyDelete] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(null)

  const load = () => {
    setBusyLoad(true)
    api('/registrations')
      .then((d) => setRegs(d.registrations))
      .catch(() => {})
      .finally(() => setBusyLoad(false))
  }
  useEffect(load, [])

  useEffect(() => {
    api('/registrations/seen', { method: 'POST' })
      .then(() => {
        window.dispatchEvent(new Event('registrations-seen'))
      })
      .catch(() => {})
  }, [])

  const isPromoter = user?.role === 'promoter'

  const total = regs ? regs.length : 0

  const eventOptions = useMemo(() => {
    const map = new Map()
    for (const r of regs || []) {
      const id = r.eventId?._id
      if (id) map.set(id, r.eventId.name || 'Event')
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [regs])

  const weightOptions = useMemo(() => {
    const s = new Set()
    for (const r of regs || []) {
      const w = r.category?.weight
      if (w != null && w !== '') s.add(String(w))
    }
    return [...s].sort((a, b) => Number(b) - Number(a) || a.localeCompare(b))
  }, [regs])

  const categoryOptions = useMemo(() => {
    const s = new Set()
    for (const r of regs || []) {
      const a = r.category?.age
      if (a != null && a !== '') s.add(String(a))
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [regs])

  const genderOptions = useMemo(() => {
    const s = new Set()
    for (const r of regs || []) {
      const g = normGender(r.category?.gender)
      if (g) s.add(g)
    }
    return [...s]
  }, [regs])

  const boutsOptions = useMemo(() => {
    const s = new Set()
    for (const r of regs || []) s.add(r.numberOfBouts || 1)
    return [...s].sort((a, b) => a - b)
  }, [regs])

  const filtered = useMemo(() => {
    let list = regs || []
    if (eventFilter !== 'all') list = list.filter((r) => r.eventId?._id === eventFilter)
    if (weightFilter !== 'all') list = list.filter((r) => String(r.category?.weight) === weightFilter)
    if (categoryFilter !== 'all') list = list.filter((r) => String(r.category?.age) === categoryFilter)
    if (genderFilter !== 'all') list = list.filter((r) => normGender(r.category?.gender) === genderFilter)
    if (boutsFilter !== 'all') list = list.filter((r) => (r.numberOfBouts || 1) === Number(boutsFilter))
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          (r.boxerId?.fullName || '').toLowerCase().includes(q) ||
          (r.clubName || r.clubId?.name || '').toLowerCase().includes(q) ||
          (r.eventId?.name || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [regs, eventFilter, weightFilter, categoryFilter, genderFilter, boutsFilter, search])

  const clearFilters = () => {
    setEventFilter('all')
    setWeightFilter('all')
    setCategoryFilter('all')
    setGenderFilter('all')
    setBoutsFilter('all')
    setSearch('')
  }

  const hasActiveFilters =
    eventFilter !== 'all' || weightFilter !== 'all' || categoryFilter !== 'all' || genderFilter !== 'all' || boutsFilter !== 'all' || search.trim() !== ''

  const runAction = async () => {
    setBusy(true)
    try {
      await api(`/registrations/manage?id=${actionReg._id}`, { method: 'POST', body: { action, feedback } })
      toast('Updated')
      setActionReg(null)
      setFeedback('')
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    setBusyDelete(true)
    try {
      await api(`/boxers?id=${deleteBoxer._id}`, { method: 'DELETE' })
      toast(`Boxer "${deleteBoxer.fullName}" removed permanently`)
      setDeleteBoxer(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusyDelete(false)
    }
  }

  const sendEmail = async (r) => {
    setSendingEmail(r._id)
    try {
      await api('/registrations/email', { method: 'POST', body: { id: r._id } })
      toast(`Email sent to ${r.email}`)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSendingEmail(null)
    }
  }

  const exportCsv = () => {
    const headers = ['Boxer', 'Club', 'Event', 'Event Date', 'Category', 'Bouts', 'Status', 'WhatsApp', 'Email', 'Registered On', 'Feedback']
    const rows = filtered.map((r) => [
      r.boxerId?.fullName || '',
      r.clubName || r.clubId?.name || '',
      r.eventId?.name || '',
      rsolveDate(r.eventId?.eventDate),
      categoryLabel(r).join(' / '),
      r.numberOfBouts || 1,
      ROW_PILLS[r.status]?.label || r.status,
      r.whatsapp || '',
      r.email || '',
      fmtDate(r.createdAt),
      r.promoterFeedback || '',
    ])
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast(`${rows.length} rows exported`)
  }

  const actionMeta = {
    approve: { title: 'Approve this registration?', icon: 'check', box: 'bg-emerald-50 text-emerald-700' },
    needs_correction: { title: 'Request corrections?', icon: 'alert', box: 'bg-amber-50 text-amber-700' },
    reject: { title: 'Reject this registration?', icon: 'x', box: 'bg-rose-50 text-rose-700' },
  }

  const rsolveDate = (iso) => {
    if (!iso) return 'Date TBD'
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registrations</h1>
              {total > 0 && (
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
                  {total} total
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">Review boxer entries, follow up with clubs and keep every event on track.</p>
          </div>
        </div>
        {isPromoter && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
              <Icon name="download" className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button size="sm" variant="secondary" onClick={load} disabled={busyLoad}>
              {busyLoad ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="refresh" className="h-3.5 w-3.5" />}
              {busyLoad ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium text-slate-700">Search</label>
            <div className="relative">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Boxer, club or event…"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <Icon name="x" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <Select label="Event" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
            <option value="all">All events</option>
            {eventOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </Select>
          <Select label="Weight" value={weightFilter} onChange={(e) => setWeightFilter(e.target.value)}>
            <option value="all">All weights</option>
            {weightOptions.map((w) => (
              <option key={w} value={w}>{w} kg</option>
            ))}
          </Select>
          <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select label="Gender" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
            <option value="all">All genders</option>
            {genderOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </Select>
          <Select label="Bouts" value={boutsFilter} onChange={(e) => setBoutsFilter(e.target.value)}>
            <option value="all">Any</option>
            {boutsOptions.map((b) => (
              <option key={b} value={b}>{b} bout{b > 1 ? 's' : ''}</option>
            ))}
          </Select>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium text-slate-400">
            Showing <span className="font-bold text-slate-700">{filtered.length}</span> of {total} registration{total === 1 ? '' : 's'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50">
              <Icon name="x" className="h-3 w-3" />
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {!regs ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty
          title={total === 0 ? 'No registrations yet' : 'No matching registrations'}
          message={
            total === 0
              ? 'Share the registration link to get boxers signed up.'
              : 'Try adjusting the filters or search term.'
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-semibold">Boxer</th>
                  <th className="px-5 py-3 font-semibold">Club</th>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 text-center font-semibold">Bouts</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Registered</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const canAction = isPromoter && ACTIONABLE.includes(r.status)
                  const cat = categoryLabel(r)
                  const isOpen = expanded === r._id
                  return (
                    <Fragment key={r._id}>
                      <tr className={cn('transition-colors group', isOpen ? 'bg-slate-50/70' : 'hover:bg-slate-50/60')}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setExpanded(isOpen ? null : r._id)}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              aria-label="Toggle details"
                            >
                              <Icon name="chevron" className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                            </button>
                            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', avatarGradient(r.boxerId?.fullName))}>
                              {initials(r.boxerId?.fullName)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                                {r.whatsapp && (
                                  <a
                                    href={waUrl(r)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:underline"
                                  >
                                    <Icon name="whatsapp" className="h-3 w-3" />
                                    {waNumber(r.whatsapp)}
                                  </a>
                                )}
                                {r.email && (
                                  <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 font-medium text-slate-500 hover:underline">
                                    <Icon name="mail" className="h-3 w-3" />
                                    <span className="max-w-40 truncate">{r.email}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                            <Icon name="flag" className="h-3.5 w-3.5 text-slate-400" />
                            {r.clubName || r.clubId?.name || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-800">{r.eventId?.name || 'Event'}</p>
                          <p className="text-xs text-slate-500">{fmtDateShort(r.eventId?.eventDate)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          {cat.length === 0 ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {cat.map((c) => (
                                <span key={c} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {(r.numberOfBouts || 1) > 1 ? (
                            <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
                              ×{r.numberOfBouts}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-500">1</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill status={r.status} />
                          {r.promoterFeedback && (
                            <p className="mt-1 max-w-44 truncate text-[11px] text-slate-500" title={`Feedback: ${r.promoterFeedback}`}>
                              {r.promoterFeedback}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon name="calendar" className="h-3.5 w-3.5 text-slate-400" />
                            {fmtDate(r.createdAt)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.whatsapp && (
                              <a
                                href={waUrl(r)}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                              >
                                <Icon name="whatsapp" className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {r.email && (
                              <button
                                onClick={() => sendEmail(r)}
                                disabled={sendingEmail === r._id}
                                title="Send email"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
                              >
                                {sendingEmail === r._id ? (
                                  <Spinner className="h-3.5 w-3.5" />
                                ) : (
                                  <Icon name="mail" className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                            {isPromoter && (
                              <button
                                onClick={() => setDeleteBoxer(r.boxerId)}
                                title="Delete boxer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Icon name="trash" className="h-4 w-4" />
                              </button>
                            )}
                            {canAction ? (
                              <>
                                <button
                                  onClick={() => { setActionReg(r); setAction('approve') }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                >
                                  <Icon name="check" className="h-3.5 w-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => { setActionReg(r); setAction('needs_correction') }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                                >
                                  Fix
                                </button>
                                <button
                                  onClick={() => { setActionReg(r); setAction('reject') }}
                                  className="inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="w-5 text-center text-xs text-slate-300">·</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={8} className="px-5 pb-4">
                            <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                              <div className="bg-white p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Club</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{r.clubName || r.clubId?.name || '—'}</p>
                              </div>
                              <div className="bg-white p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Event date</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">{fmtDateShort(r.eventId?.eventDate) || '—'}</p>
                              </div>
                              <div className="bg-white p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Category</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">
                                  {cat.length ? cat.join(' · ') : '—'}
                                  {(r.numberOfBouts || 1) > 1 && <span className="ml-1 text-amber-600">×{r.numberOfBouts} bouts</span>}
                                </p>
                              </div>
                              <div className="bg-white p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Contact</p>
                                <div className="mt-1 flex flex-col gap-0.5 text-sm">
                                  {r.whatsapp && (
                                    <a href={waUrl(r)} target="_blank" rel="noreferrer" className="font-medium text-emerald-600 hover:underline">
                                      {waNumber(r.whatsapp)}
                                    </a>
                                  )}
                                  {r.email && (
                                    <a href={`mailto:${r.email}`} className="truncate font-medium text-slate-800 hover:underline">
                                      {r.email}
                                    </a>
                                  )}
                                  {!r.whatsapp && !r.email && <span className="text-slate-400">—</span>}
                                </div>
                              </div>
                              {r.promoterFeedback && (
                                <div className="bg-white p-4 sm:col-span-2 lg:col-span-4">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Promoter note</p>
                                  <p className="mt-1 text-sm text-slate-700">{r.promoterFeedback}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={!!actionReg}
        onClose={() => setActionReg(null)}
        title="Confirm Action"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionReg(null)}>Cancel</Button>
            <Button onClick={runAction} disabled={busy} variant={action === 'reject' ? 'danger' : 'primary'}>
              {busy ? <Spinner className="h-4 w-4 border-white" /> : action === 'approve' ? 'Confirm Approval' : action === 'reject' ? 'Confirm Rejection' : 'Request Correction'}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', actionMeta[action]?.box || 'bg-slate-100 text-slate-600')}>
            <Icon name={actionMeta[action]?.icon || 'check'} className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">{actionMeta[action]?.title || 'Confirm action?'}</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {actionReg?.boxerId?.fullName} · {actionReg?.clubName || actionReg?.clubId?.name || 'Unknown club'} · {actionReg?.eventId?.name || 'Unknown event'}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Textarea label="Note for the club (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="e.g. Please fix the weight class — it doesn't match the age group." />
        </div>
      </Modal>

      <Modal
        open={!!deleteBoxer}
        onClose={() => setDeleteBoxer(null)}
        title="Delete Boxer Permanently"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteBoxer(null)}>Cancel</Button>
            <Button onClick={confirmDelete} disabled={busyDelete} variant="danger">
              {busyDelete ? <Spinner className="h-4 w-4 border-white" /> : 'Delete Permanently'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          You are about to permanently delete{' '}
          <span className="font-semibold text-slate-900">{deleteBoxer?.fullName || 'this boxer'}</span>.
        </p>
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          This removes them from every event — registrations, draws, weigh-ins and recorded results — and cannot be undone.
        </div>
      </Modal>
    </div>
  )
}