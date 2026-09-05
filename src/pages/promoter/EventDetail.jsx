import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { StatusBadge, Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input, Textarea } from '../../components/Field.jsx'
import TagInput from '../../components/TagInput.jsx'
import { cn } from '../../utils/cn.js'

const PORTAL_ROLES = [
  { role: 'commentator', title: 'Commentator', desc: 'Fight card and boxer profiles for live commentary.' },
  { role: 'mc', title: 'MC', desc: 'Fight card only, for the master of ceremonies.' },
  { role: 'official', title: 'Officials', desc: 'Fight schedule and recorded results for officials.' },
  { role: 'judge', title: 'Judges', desc: 'Fight schedule and recorded results for the judging panel.' },
]

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const daysUntil = (iso) => {
  if (!iso) return null
  const diff = Math.round((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  if (diff < 0) return 'Passed'
  if (diff === 0) return 'Today'
  return `${diff} day${diff === 1 ? '' : 's'}`
}

function StatCard({ label, value, sub, accent }) {
  return (
    <Card className="p-4">
      <p className={cn('text-2xl font-bold', accent || 'text-slate-900')}>{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{label}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </Card>
  )
}

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState(null)
  const [bouts, setBouts] = useState(null)
  const [tab, setTab] = useState('overview')
  const [actionReg, setActionReg] = useState(null)
  const [action, setAction] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [weighReg, setWeighReg] = useState(null)
  const [weighWeight, setWeighWeight] = useState('')
  const [weighNotes, setWeighNotes] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    venue: '',
    location: '',
    eventDate: '',
    registrationOpens: '',
    registrationDeadline: '',
    weighInDate: '',
    rules: '',
    registrationRequirements: '',
    requireWeighIn: true,
    public: false,
  })
  const [editWeightCategories, setEditWeightCategories] = useState([])
  const [editAgeCategories, setEditAgeCategories] = useState([])
  const [portals, setPortals] = useState(null)
  const [portalBusy, setPortalBusy] = useState(null)

  const load = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/registrations?eventId=${id}`).then((d) => setRegistrations(d.registrations)).catch(() => {})
    api(`/bouts?eventId=${id}`).then((d) => setBouts(d.bouts)).catch(() => setBouts([]))
    api(`/role-links?eventId=${id}`).then((d) => setPortals(d.links)).catch(() => setPortals([]))
  }

  useEffect(load, [id])

  const runAction = async () => {
    setBusy(true)
    try {
      await api(`/registrations/manage?id=${actionReg._id}`, { method: 'POST', body: { action, feedback } })
      toast('Updated successfully')
      setActionReg(null)
      setFeedback('')
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const recordWeight = async () => {
    if (!weighWeight) {
      toast('Enter an official weight', 'error')
      return
    }
    setBusy(true)
    try {
      await api(`/weighins/record?registrationId=${weighReg._id}`, {
        method: 'POST',
        body: { officialWeightKg: Number(weighWeight), notes: weighNotes },
      })
      toast('Weigh-in recorded')
      setWeighReg(null)
      setWeighWeight('')
      setWeighNotes('')
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const toggleRegistration = async (open) => {
    try {
      await api(`/events/update?id=${id}`, { method: 'PATCH', body: { registrationOpen: open } })
      toast(open ? 'Registration opened' : 'Registration closed')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const changeStatus = async (status) => {
    try {
      const registrationOpen = status === 'open' || status === 'in_progress'
      await api(`/events/update?id=${id}`, { method: 'PATCH', body: { status, registrationOpen } })
      toast(`Event status set to ${status}`)
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const openEdit = () => {
    setEditForm({
      name: event.name || '',
      description: event.description || '',
      venue: event.venue || '',
      location: event.location || '',
      eventDate: event.eventDate ? String(event.eventDate).slice(0, 10) : '',
      registrationOpens: event.registrationOpens ? String(event.registrationOpens).slice(0, 10) : '',
      registrationDeadline: event.registrationDeadline ? String(event.registrationDeadline).slice(0, 10) : '',
      weighInDate: event.weighInDate ? String(event.weighInDate).slice(0, 10) : '',
      rules: event.rules || '',
      registrationRequirements: event.registrationRequirements || '',
      requireWeighIn: event.requireWeighIn ?? true,
      public: event.public || false,
    })
    setEditWeightCategories([...(event.weightCategories || [])])
    setEditAgeCategories([...(event.ageCategories || [])])
    setEditOpen(true)
  }

  const saveEdit = async () => {
    setBusy(true)
    try {
      await api(`/events/update?id=${id}`, {
        method: 'PATCH',
        body: {
          name: editForm.name,
          description: editForm.description,
          venue: editForm.venue,
          location: editForm.location,
          eventDate: editForm.eventDate ? new Date(editForm.eventDate) : null,
          registrationOpens: editForm.registrationOpens ? new Date(editForm.registrationOpens) : null,
          registrationDeadline: editForm.registrationDeadline ? new Date(editForm.registrationDeadline) : null,
          weighInDate: editForm.weighInDate ? new Date(editForm.weighInDate) : null,
          rules: editForm.rules,
          registrationRequirements: editForm.registrationRequirements,
          weightCategories: editWeightCategories,
          ageCategories: editAgeCategories,
          requireWeighIn: editForm.requireWeighIn,
          public: editForm.public,
        },
      })
      toast('Event details updated')
      setEditOpen(false)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete event "${event.name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      await api(`/events?id=${id}`, { method: 'DELETE' })
      toast('Event deleted')
      navigate('/app/events')
    } catch (err) {
      toast(err.message, 'error')
      setBusy(false)
    }
  }

  if (!event) return <Loading />
  if (!registrations) return <Loading />

  const regs = registrations
  const pendingCount = regs.filter((r) => ['pending_approval', 'needs_correction'].includes(r.status)).length
  const eligibleCount = regs.filter((r) => ['eligible', 'completed'].includes(r.status)).length
  const weighedCount = regs.filter((r) => r.weighIn?.status === 'successful').length
  const boutCount = bouts ? bouts.length : 0
  const countdown = daysUntil(event.eventDate)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'registrations', label: `Registrations`, count: regs.length },
    { id: 'weighins', label: 'Weigh-In', count: `${weighedCount}/${regs.length}` },
    { id: 'portals', label: 'Portals' },
  ]

  const registrationUrl = `${window.location.origin}/register/${event.registrationToken}`

  const copyRegistration = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl)
      toast('Registration link copied')
    } catch {
      window.prompt('Copy this link:', registrationUrl)
    }
  }

  const portalUrl = (token) => `${window.location.origin}/portal/${token}`

  const copyPortal = async (token) => {
    try {
      await navigator.clipboard.writeText(portalUrl(token))
      toast('Portal link copied')
    } catch {
      window.prompt('Copy this link:', portalUrl(token))
    }
  }

  const portalAction = async (role, action, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return
    setPortalBusy(role)
    try {
      await api(`/role-links?eventId=${id}`, { method: 'POST', body: { role, action } })
      toast('Portal link updated')
      const d = await api(`/role-links?eventId=${id}`)
      setPortals(d.links)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setPortalBusy(null)
    }
  }

  const categoryLabel = (r) => {
    const parts = []
    if (r.category?.age) parts.push(r.category.age)
    if (r.category?.weight) parts.push(r.category.weight)
    if (r.category?.gender) parts.push(r.category.gender === 'Mixed' ? 'Mixed' : r.category.gender)
    return parts
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 px-6 py-6 text-white shadow-lg sm:px-8 sm:py-8">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-600/30 blur-2xl" />
        <div className="absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10">
          <button onClick={() => navigate('/app/events')} className="text-sm text-blue-200 hover:text-white">← Back to Events</button>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl">{event.name}</h1>
                <StatusBadge status={event.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
                <span>📍 {[event.venue, event.location].filter(Boolean).join(' · ') || 'Venue TBA'}</span>
                {event.eventDate && <span>🗓 {fmtDate(event.eventDate)}</span>}
                {countdown && (
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', countdown === 'Passed' ? 'bg-white/10 text-slate-400' : countdown === 'Today' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-blue-400/20 text-blue-200')}>
                    {countdown === 'Passed' ? 'Event passed' : countdown === 'Today' ? 'Event is today' : `In ${countdown}`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={event.status}
                onChange={(e) => changeStatus(e.target.value)}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 [&>option]:text-slate-900"
              >
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/draws`)}>Draws</Button>
              <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/results`)}>Results</Button>
              <Button variant="secondary" onClick={openEdit}>Edit</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Registrations" value={regs.length} sub={pendingCount ? `${pendingCount} pending approval` : 'No pending items'} />
        <StatCard label="Eligible Boxers" value={eligibleCount} sub="Ready for the draw" accent="text-emerald-600" />
        <StatCard label="Weighed In" value={`${weighedCount}/${regs.length}`} sub="Successful weigh-ins" accent="text-blue-600" />
        <StatCard label="Bouts Scheduled" value={boutCount} sub="Current draw size" accent="text-brand-600" />
      </div>

      <div className="mb-6 mt-2 flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition',
              tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', tab === t.id ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Event Details</h3>
            </div>
            <dl className="divide-y divide-slate-100 px-5 py-2 text-sm">
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Status</dt>
                <dd><StatusBadge status={event.status} /></dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Event Date</dt>
                <dd className="text-right font-medium text-slate-900">{fmtDate(event.eventDate)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Venue</dt>
                <dd className="text-right font-medium text-slate-900">{event.venue || '—'}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Location</dt>
                <dd className="text-right font-medium text-slate-900">{event.location || '—'}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Weigh-In</dt>
                <dd className="text-right font-medium text-slate-900">{fmtDate(event.weighInDate)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-slate-500">Registration Deadline</dt>
                <dd className="text-right font-medium text-slate-900">{fmtDate(event.registrationDeadline)}</dd>
              </div>
              {event.description && (
                <div className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-slate-500">Description</dt>
                  <dd className="text-right text-slate-700">{event.description}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Competition</h3>
            </div>
            <div className="space-y-5 px-5 py-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weight Categories</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.weightCategories?.length ? event.weightCategories.map((c) => <Badge key={c} tone="outline" className="px-3 py-1">{c}</Badge>) : <span className="text-slate-400">None</span>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Age Categories</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.ageCategories?.length ? event.ageCategories.map((c) => <Badge key={c} tone="outline" className="px-3 py-1">{c}</Badge>) : <span className="text-slate-400">None</span>}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-700">Weigh-in required</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', event.requireWeighIn ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600')}>
                  {event.requireWeighIn ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-700">Public listing</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', event.public ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600')}>
                  {event.public ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden lg:col-span-2">
            <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Registration Link</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-slate-500">
                Share this link with any team or manager. Anyone who opens it can register boxers (name, age, weight, bouts,
                club) for this event without an account or payment.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{registrationUrl}</span>
                <Button size="sm" variant="secondary" onClick={copyRegistration}>Copy</Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', event.registrationOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
                  {event.registrationOpen ? 'Registration open' : 'Registration closed'}
                </span>
                {event.registrationOpen ? (
                  <Button size="sm" variant="secondary" onClick={() => toggleRegistration(false)}>Close Registration</Button>
                ) : (
                  <Button size="sm" onClick={() => toggleRegistration(true)}>Open Registration</Button>
                )}
              </div>
            </div>
          </Card>

          {event.rules && (
            <Card className="overflow-hidden lg:col-span-2">
              <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Rules & Requirements</h3>
              </div>
              <div className="px-5 py-4">
                <p className="whitespace-pre-line text-sm text-slate-700">{event.rules}</p>
                {event.registrationRequirements && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration Requirements</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{event.registrationRequirements}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'registrations' && (
        <Card className="overflow-hidden">
          {regs.length === 0 ? (
            <Empty title="No registrations yet" message="Share the registration link to get boxers signed up." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">Boxer</th>
                    <th className="px-5 py-3 font-semibold">Club</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regs.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            {initials(r.boxerId?.fullName)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                            {r.promoterFeedback && <p className="max-w-56 truncate text-xs text-slate-600">Feedback: {r.promoterFeedback}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{r.clubName || r.clubId?.name || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {categoryLabel(r).length === 0
                            ? <span className="text-slate-400">—</span>
                            : categoryLabel(r).map((c) => (
                                <span key={c} className="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">{c}</span>
                              ))}
                          {r.numberOfBouts > 1 && <span className="text-xs text-slate-500">×{r.numberOfBouts}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {['pending_approval', 'needs_correction'].includes(r.status) ? (
                            <>
                              <Button size="sm" onClick={() => { setActionReg(r); setAction('approve') }}>Approve</Button>
                              <Button size="sm" variant="secondary" onClick={() => { setActionReg(r); setAction('needs_correction') }}>Request Change</Button>
                              <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('reject') }}>Reject</Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'weighins' && (
        <Card className="overflow-hidden">
          {regs.length === 0 ? (
            <Empty title="No registrations" />
          ) : (
            <div className="p-0">
              <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900">Weigh-In Progress</p>
                  <p className="text-sm font-semibold text-slate-700">{weighedCount} of {regs.length} weighed</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
                    style={{ width: regs.length ? `${Math.round((weighedCount / regs.length) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 font-semibold">Boxer</th>
                      <th className="px-5 py-3 font-semibold">Club</th>
                      <th className="px-5 py-3 font-semibold">Official Weight</th>
                      <th className="px-5 py-3 font-semibold">Weighed At</th>
                      <th className="px-5 py-3 font-semibold">Weigh-In</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {regs.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                              {initials(r.boxerId?.fullName)}
                            </span>
                            <span className="font-semibold text-slate-900">{r.boxerId?.fullName || 'Boxer'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{r.clubName || r.clubId?.name || '—'}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          {r.weighIn?.officialWeightKg ? `${r.weighIn.officialWeightKg} kg` : '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                          {r.weighIn?.weighedAt ? new Date(r.weighIn.weighedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td className="px-5 py-3.5"><StatusBadge status={r.weighIn?.status} /></td>
                        <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            {r.weighIn?.status !== 'successful' ? (
                              <Button size="sm" variant="secondary" onClick={() => { setWeighReg(r); setWeighWeight(r.boxerId?.registeredWeightKg || ''); setWeighNotes('') }}>
                                Record Weight
                              </Button>
                            ) : (
                              <>
                                {r.status !== 'eligible' && (
                                  <Button size="sm" onClick={() => { setActionReg(r); setAction('mark_eligible') }}>Mark Eligible</Button>
                                )}
                                <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('mark_ineligible') }}>Not Eligible</Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'portals' && (
        <div className="grid gap-6">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">Staff Portals</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Generate a link for each role below, copy it, and send it directly to the person. Nobody needs an
                  account to open a portal — they are strictly read-only and stop working the moment you disable,
                  regenerate, or remove the link.
                </p>
              </div>
            </div>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            {PORTAL_ROLES.map((cfg) => {
              const link = (portals || []).find((p) => p.role === cfg.role)
              const busy = portalBusy === cfg.role
              return (
                <Card key={cfg.role} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{cfg.title} Portal</h4>
                      <p className="text-sm text-slate-500">{cfg.desc}</p>
                    </div>
                    {link && (
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', link.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')}>
                        {link.active ? 'Active' : 'Disabled'}
                      </span>
                    )}
                  </div>
                  {link ? (
                    <div className="mt-4">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Share this link</p>
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{portalUrl(link.token)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => copyPortal(link.token)}>Copy Link</Button>
                        <Button size="sm" variant="secondary" onClick={() => portalAction(cfg.role, 'regenerate', 'Generate a new link? The old link will stop working immediately.')} disabled={busy}>
                          {busy ? 'Working…' : 'New Link'}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => portalAction(cfg.role, 'toggle')} disabled={busy}>
                          {link.active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => portalAction(cfg.role, 'remove', 'Remove this portal link permanently?')} disabled={busy}>
                          Remove
                        </Button>
                      </div>
                      {link.lastUsedAt && (
                        <p className="mt-3 text-xs text-slate-400">Last opened {new Date(link.lastUsedAt).toLocaleString()}</p>
                      )}
                    </div>
                  ) : (
                    <Button className="mt-4" size="sm" onClick={() => portalAction(cfg.role, 'create')} disabled={busy}>
                      {busy ? 'Creating…' : 'Create Link'}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <Modal
        open={!!weighReg}
        onClose={() => setWeighReg(null)}
        title={`Record Weigh-In — ${weighReg?.boxerId?.fullName || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setWeighReg(null)}>Cancel</Button>
            <Button onClick={recordWeight} disabled={busy}>Record Weight</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Official Weight (kg)" type="number" step="0.1" value={weighWeight} onChange={(e) => setWeighWeight(e.target.value)} required />
        </div>
      </Modal>

      <Modal
        open={!!actionReg}
        onClose={() => setActionReg(null)}
        title={action === 'approve' ? 'Approve Registration' : action === 'reject' ? 'Reject Registration' : action === 'needs_correction' ? 'Request Correction' : 'Action'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionReg(null)}>Cancel</Button>
            <Button onClick={runAction} disabled={busy} variant={action.includes('reject') ? 'danger' : 'primary'}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {actionReg?.boxerId?.fullName} — {actionReg?.clubName || actionReg?.clubId?.name}
        </p>
        <div className="mt-4">
          <Textarea label="Feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="Optional note to the club" />
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Event Details"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy}>{busy ? <Spinner className="h-4 w-4 border-white" /> : 'Save Changes'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Event Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          <Textarea label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Venue" value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} />
            <Input label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Event Date" type="date" value={editForm.eventDate} onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })} />
            <Input label="Registration Opens" type="date" value={editForm.registrationOpens} onChange={(e) => setEditForm({ ...editForm, registrationOpens: e.target.value })} />
            <Input label="Registration Deadline" type="date" value={editForm.registrationDeadline} onChange={(e) => setEditForm({ ...editForm, registrationDeadline: e.target.value })} />
            <Input label="Weigh-In Date" type="date" value={editForm.weighInDate} onChange={(e) => setEditForm({ ...editForm, weighInDate: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TagInput label="Weight Categories" placeholder="e.g. 60kg" values={editWeightCategories} setValues={setEditWeightCategories} />
            <TagInput label="Age Categories" placeholder="e.g. Junior" values={editAgeCategories} setValues={setEditAgeCategories} />
          </div>
          <Textarea label="Competition Rules" value={editForm.rules} onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })} rows={2} />
          <Textarea label="Registration Requirements" value={editForm.registrationRequirements} onChange={(e) => setEditForm({ ...editForm, registrationRequirements: e.target.value })} rows={2} />
          <div className="border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Settings</p>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editForm.requireWeighIn} onChange={(e) => setEditForm({ ...editForm, requireWeighIn: e.target.checked })} className="h-4 w-4 rounded" />
                <span className="text-sm text-slate-700">Require weigh-in before competition</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editForm.public} onChange={(e) => setEditForm({ ...editForm, public: e.target.checked })} className="h-4 w-4 rounded" />
                <span className="text-sm text-slate-700">Make event visible to the public</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}