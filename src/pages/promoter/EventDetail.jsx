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

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState(null)
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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'registrations', label: `Registrations (${registrations.length})` },
    { id: 'weighins', label: 'Weigh-In' },
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

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 px-6 py-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-600/30 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={() => navigate('/app/events')} className="mb-1 text-sm text-blue-200 hover:text-white">← Events</button>
            <h1 className="text-2xl font-bold sm:text-3xl">{event.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <span>{event.venue}{event.location && ` · ${event.location}`}</span>
              {event.eventDate && <span>· {new Date(event.eventDate).toLocaleDateString()}</span>}
              <span className="ml-1"><StatusBadge status={event.status} /></span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={openEdit}>Edit Details</Button>
            <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/draws`)}>Draws</Button>
            <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/bouts`)}>Bouts</Button>
            <Button variant="secondary" onClick={() => navigate(`/app/events/${id}/results`)}>Results</Button>
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
            <Button variant="danger" onClick={handleDelete}>Delete Event</Button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-3 text-base font-semibold">Event Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Description</dt><dd className="text-right">{event.description || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Venue</dt><dd>{event.venue || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd>{event.location || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Weigh-In Date</dt><dd>{event.weighInDate ? new Date(event.weighInDate).toLocaleDateString() : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Registration Deadline</dt><dd>{event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={event.status} /></dd></div>
            </dl>
          </Card>
          <Card className="p-6">
            <h3 className="mb-3 text-base font-semibold">Categories</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Weight Categories</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {event.weightCategories?.length ? event.weightCategories.map((c) => <Badge key={c}>{c}</Badge>) : <span>None</span>}
                </div>
              </div>
              <div>
                <p className="text-slate-500">Age Categories</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {event.ageCategories?.length ? event.ageCategories.map((c) => <Badge key={c}>{c}</Badge>) : <span>None</span>}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Registration Link</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Share this link with any team or manager. Anyone who opens it can register boxers (name, age, weight, bouts,
              club) for this event without an account or payment.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{registrationUrl}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={copyRegistration}>Copy Link</Button>
              {event.registrationOpen ? (
                <Button size="sm" variant="secondary" onClick={() => toggleRegistration(false)}>Close Registration</Button>
              ) : (
                <Button size="sm" onClick={() => toggleRegistration(true)}>Open Registration</Button>
              )}
            </div>
          </Card>

          {event.rules && (
            <Card className="p-6 lg:col-span-2">
              <h3 className="mb-2 text-base font-semibold">Rules</h3>
              <p className="whitespace-pre-line text-sm text-slate-700">{event.rules}</p>
            </Card>
          )}
        </div>
      )}

      {tab === 'registrations' && (
        <Card>
          <div className="p-0">
            {registrations.length === 0 ? (
              <Empty title="No registrations yet" message="Share the registration link to get boxers signed up." />
            ) : (
              <ul className="divide-y divide-slate-200">
                {registrations.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                      <p className="text-sm text-slate-500">
                        {r.clubName || r.clubId?.name}
                        {r.boxerId?.weightCategory && ` · ${r.boxerId.weightCategory}`}
                      </p>
                      {r.promoterFeedback && <p className="mt-1 text-xs text-slate-800">Feedback: {r.promoterFeedback}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      {(r.status === 'pending_approval' || r.status === 'needs_correction') && (
                        <>
                          <Button size="sm" onClick={() => { setActionReg(r); setAction('approve') }}>Approve</Button>
                          <Button size="sm" variant="secondary" onClick={() => { setActionReg(r); setAction('needs_correction') }}>Request Change</Button>
                          <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('reject') }}>Reject</Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === 'weighins' && (
        <Card>
          <div className="p-0">
            <ul className="divide-y divide-slate-200">
              {registrations.length === 0 ? (
                <Empty title="No registrations" />
              ) : (
                registrations.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{r.boxerId?.fullName}</p>
                      <p className="text-sm text-slate-500">
                        {r.clubName || r.clubId?.name}
                        {r.weighIn?.officialWeightKg && ` · Official weight: ${r.weighIn.officialWeightKg}kg`}
                        {r.weighIn?.weighedAt && ` · ${new Date(r.weighIn.weighedAt).toLocaleString()}`}
                      </p>
                      {r.weighIn?.notes && <p className="mt-1 text-xs text-slate-500">{r.weighIn.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={r.weighIn?.status} />
                      <StatusBadge status={r.status} />
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
                  </li>
                ))
              )}
            </ul>
          </div>
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
