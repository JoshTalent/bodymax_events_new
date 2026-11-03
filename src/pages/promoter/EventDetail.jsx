import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { StatusBadge, Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input, Select, Textarea } from '../../components/Field.jsx'
import TagInput from '../../components/TagInput.jsx'
import { StatCard } from '../../components/StatCard.jsx'
import { Icon } from '../../components/Icons.jsx'
import { DonutChart, BarList, RadialProgress } from '../../components/Charts.jsx'
import { cn } from '../../utils/cn.js'

const PORTAL_ROLES = [
  { role: 'commentator', title: 'Commentator', desc: 'Fight card and boxer profiles for live commentary.' },
  { role: 'mc', title: 'MC', desc: 'Fight card only, for the master of ceremonies.' },
  { role: 'official', title: 'Officials', desc: 'Fight schedule and recorded results for officials.' },
  { role: 'judge', title: 'Judges', desc: 'Fight schedule and recorded results for the judging panel.' },
]

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const fmtShort = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const daysUntil = (iso) => {
  if (!iso) return null
  const diff = Math.round((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  if (diff < 0) return 'Passed'
  if (diff === 0) return 'Today'
  return `${diff} day${diff === 1 ? '' : 's'}`
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function Panel({ title, subtitle, action, children, className, bodyClassName }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={cn('px-5 py-4', bodyClassName)}>{children}</div>
    </Card>
  )
}

function DetailRow({ label, value, icon }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="flex items-center gap-2 text-slate-500">
        {icon && <Icon name={icon} className="h-3.5 w-3.5 text-slate-400" />}
        {label}
      </dt>
      <dd className="max-w-[60%] text-right font-semibold text-slate-900">{value || '—'}</dd>
    </div>
  )
}

function CategoryField({ label, value, onChange, options, placeholder }) {
  if (options?.length) {
    return (
      <Select label={label} value={value} onChange={onChange}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </Select>
    )
  }
  return <Input label={label} value={value} onChange={onChange} placeholder={placeholder} />
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const canManage = user?.role === 'promoter'

  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState(null)
  const [bouts, setBouts] = useState(null)
  const [assignedClubs, setAssignedClubs] = useState([])
  const [directory, setDirectory] = useState([])
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

  const [assignClubOpen, setAssignClubOpen] = useState(false)
  const [clubSearch, setClubSearch] = useState('')
  const [clubBusy, setClubBusy] = useState(null)

  const [clubFormOpen, setClubFormOpen] = useState(false)
  const [clubForm, setClubForm] = useState({ name: '', contactName: '', contactEmail: '', contactPhone: '', address: '' })
  const [clubSaving, setClubSaving] = useState(false)

  const [boxerModal, setBoxerModal] = useState(false)
  const [boxerMode, setBoxerMode] = useState('existing')
  const [boxerClubId, setBoxerClubId] = useState('')
  const [clubBoxers, setClubBoxers] = useState([])
  const [clubBoxersLoading, setClubBoxersLoading] = useState(false)
  const [boxerPickId, setBoxerPickId] = useState('')
  const [boxerCat, setBoxerCat] = useState({ weight: '', age: '', gender: '' })
  const [newBoxer, setNewBoxer] = useState({
    fullName: '',
    gender: 'M',
    dateOfBirth: '',
    registeredWeightKg: '',
    experience: '',
  })
  const [boxerSaving, setBoxerSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [clubFilter, setClubFilter] = useState('all')

  const load = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/registrations?eventId=${id}`).then((d) => setRegistrations(d.registrations)).catch(() => {})
    api(`/bouts?eventId=${id}`).then((d) => setBouts(d.bouts)).catch(() => setBouts([]))
    api(`/role-links?eventId=${id}`).then((d) => setPortals(d.links)).catch(() => setPortals([]))
    api(`/event-clubs?eventId=${id}`).then((d) => setAssignedClubs(d.clubs || [])).catch(() => setAssignedClubs([]))
    api('/clubs').then((d) => setDirectory(d.clubs || [])).catch(() => setDirectory([]))
  }

  useEffect(load, [id])

  useEffect(() => {
    if (!boxerModal || !boxerClubId) {
      setClubBoxers([])
      return
    }
    let cancelled = false
    setClubBoxersLoading(true)
    api(`/boxers?clubId=${boxerClubId}`)
      .then((d) => !cancelled && setClubBoxers(d.boxers || []))
      .catch(() => !cancelled && setClubBoxers([]))
      .finally(() => !cancelled && setClubBoxersLoading(false))
    return () => {
      cancelled = true
    }
  }, [boxerModal, boxerClubId])

  const regs = registrations || []
  const assignedClubIds = useMemo(() => new Set(assignedClubs.map((c) => String(c._id))), [assignedClubs])

  const pendingCount = regs.filter((r) => ['pending_approval', 'needs_correction'].includes(r.status)).length
  const eligibleCount = regs.filter((r) => ['eligible', 'completed'].includes(r.status)).length
  const weighedCount = regs.filter((r) => r.weighIn?.status === 'successful').length
  const boutCount = bouts ? bouts.length : 0
  const countdown = event ? daysUntil(event.eventDate) : null

  const clubGroups = useMemo(() => {
    const groups = new Map()
    assignedClubs.forEach((c) => {
      groups.set(String(c._id), { key: String(c._id), club: c, name: c.name, boxers: [], assigned: true })
    })
    regs.forEach((r) => {
      const clubId = r.boxerId?.clubId ? String(r.boxerId.clubId) : null
      const name = r.boxerId?.clubName || r.clubName || 'Unattached'
      const key = clubId || `name:${name.toLowerCase()}`
      if (!groups.has(key)) {
        groups.set(key, { key, club: null, name, boxers: [], assigned: false })
      }
      groups.get(key).boxers.push(r)
    })
    return [...groups.values()].sort((a, b) => b.boxers.length - a.boxers.length || a.name.localeCompare(b.name))
  }, [assignedClubs, regs])

  const statusBuckets = [
    { label: 'Pending review', value: regs.filter((r) => ['pending_approval', 'needs_correction'].includes(r.status)).length, color: '#f59e0b' },
    { label: 'Cleared to compete', value: regs.filter((r) => ['eligible', 'completed'].includes(r.status)).length, color: '#10b981' },
    { label: 'In processing', value: regs.filter((r) => ['registered', 'approved', 'awaiting_weighin', 'weighed'].includes(r.status)).length, color: '#3b82f6' },
    { label: 'Other', value: regs.filter((r) => !['pending_approval', 'needs_correction', 'eligible', 'completed', 'registered', 'approved', 'awaiting_weighin', 'weighed'].includes(r.status)).length, color: '#94a3b8' },
  ].filter((d) => d.value > 0)

  const weightDist = useMemo(() => {
    const counts = regs.reduce((acc, r) => {
      const w = r.category?.weight || 'Unclassified'
      acc[w] = (acc[w] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [regs])

  const genderSplit = useMemo(() => {
    const male = regs.filter((r) => r.boxerId?.gender === 'M').length
    const female = regs.filter((r) => r.boxerId?.gender === 'F').length
    return { male, female }
  }, [regs])

  const weighPct = regs.length ? Math.round((weighedCount / regs.length) * 100) : 0
  const approvalPct = regs.length ? Math.round(((regs.length - pendingCount) / regs.length) * 100) : 0

  const availableDirectory = useMemo(() => {
    const q = clubSearch.trim().toLowerCase()
    return directory.filter((c) => {
      if (assignedClubIds.has(String(c._id))) return false
      if (!q) return true
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.contactName || '').toLowerCase().includes(q) ||
        (c.contactEmail || '').toLowerCase().includes(q)
      )
    })
  }, [directory, assignedClubIds, clubSearch])

  const availableBoxers = useMemo(() => {
    const registeredIds = new Set(regs.map((r) => String(r.boxerId?._id || r.boxerId || '')))
    return clubBoxers.filter((b) => !registeredIds.has(String(b._id)))
  }, [clubBoxers, regs])

  const filteredRegs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return regs.filter((r) => {
      const clubKey = r.boxerId?.clubId ? String(r.boxerId.clubId) : `name:${(r.boxerId?.clubName || r.clubName || '').toLowerCase()}`
      if (clubFilter !== 'all' && clubKey !== clubFilter) return false
      if (!q) return true
      return (
        (r.boxerId?.fullName || '').toLowerCase().includes(q) ||
        (r.boxerId?.clubName || r.clubName || '').toLowerCase().includes(q) ||
        (r.category?.weight || '').toLowerCase().includes(q)
      )
    })
  }, [regs, search, clubFilter])

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
      toast(`Event status set to ${status.replace('_', ' ')}`)
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

  const assignClub = async (clubId) => {
    setClubBusy(clubId)
    try {
      const d = await api('/event-clubs', { method: 'POST', body: { eventId: id, clubId } })
      setAssignedClubs(d.clubs || [])
      toast('Club assigned to event')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setClubBusy(null)
    }
  }

  const removeClub = async (clubId) => {
    setClubBusy(clubId)
    try {
      let res = await api(`/event-clubs?eventId=${id}&clubId=${clubId}`, { method: 'DELETE' })
      if (res.requiresConfirmation) {
        if (!window.confirm(`${res.message}\n\nRemove the club and its boxers from this event?`)) return
        res = await api(`/event-clubs?eventId=${id}&clubId=${clubId}&force=true`, { method: 'DELETE' })
      }
      setAssignedClubs(res.clubs || [])
      toast('Club removed from event')
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setClubBusy(null)
    }
  }

  const createClub = async (e) => {
    e?.preventDefault()
    if (!clubForm.name.trim()) {
      toast('Club name is required', 'error')
      return
    }
    setClubSaving(true)
    try {
      const created = await api('/clubs', { method: 'POST', body: clubForm })
      const clubId = created.club?._id
      if (clubId) {
        const d = await api('/event-clubs', { method: 'POST', body: { eventId: id, clubId } })
        setAssignedClubs(d.clubs || [])
      }
      toast('Club created and assigned')
      setClubFormOpen(false)
      setClubForm({ name: '', contactName: '', contactEmail: '', contactPhone: '', address: '' })
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setClubSaving(false)
    }
  }

  const openBoxerModal = () => {
    setBoxerMode('existing')
    setBoxerClubId(assignedClubs[0]?._id || '')
    setBoxerPickId('')
    setBoxerCat({ weight: '', age: '', gender: '' })
    setNewBoxer({ fullName: '', gender: 'M', dateOfBirth: '', registeredWeightKg: '', experience: '' })
    setBoxerModal(true)
  }

  const assignBoxer = async () => {
    if (!boxerClubId) {
      toast('Assign a club to this event first', 'error')
      return
    }
    setBoxerSaving(true)
    try {
      let boxerId = boxerPickId
      if (boxerMode === 'new') {
        if (!newBoxer.fullName.trim()) {
          toast('Enter the boxer name', 'error')
          setBoxerSaving(false)
          return
        }
        const created = await api('/boxers', {
          method: 'POST',
          body: {
            fullName: newBoxer.fullName,
            clubId: boxerClubId,
            gender: boxerCat.gender || newBoxer.gender || 'M',
            dateOfBirth: newBoxer.dateOfBirth ? new Date(newBoxer.dateOfBirth) : null,
            registeredWeightKg: newBoxer.registeredWeightKg ? Number(newBoxer.registeredWeightKg) : null,
            weightCategory: boxerCat.weight || '',
            ageCategory: boxerCat.age || '',
            experience: newBoxer.experience || '',
          },
        })
        boxerId = created.boxer?._id
      }
      if (!boxerId) {
        toast('Select a boxer to assign', 'error')
        setBoxerSaving(false)
        return
      }
      await api('/registrations', {
        method: 'POST',
        body: {
          eventId: id,
          boxerId,
          category: {
            weight: boxerCat.weight,
            age: boxerCat.age,
            gender: boxerCat.gender,
          },
        },
      })
      toast('Boxer assigned to event')
      setBoxerModal(false)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBoxerSaving(false)
    }
  }

  const removeReg = async (reg) => {
    const name = reg.boxerId?.fullName || 'this boxer'
    if (!window.confirm(`Remove ${name} from this event? Any bouts involving this entry will be deleted.`)) return
    try {
      await api(`/registrations?id=${reg._id}`, { method: 'DELETE' })
      toast('Boxer removed from event')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const registrationUrl = event ? `${window.location.origin}/register/${event.registrationToken}` : ''

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

  const portalAction = async (role, act, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return
    setPortalBusy(role)
    try {
      await api(`/role-links?eventId=${id}`, { method: 'POST', body: { role, action: act } })
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

  if (!event) return <Loading />
  if (!registrations) return <Loading />

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    ...(canManage ? [{ id: 'clubs', label: 'Clubs', icon: 'clubs', count: clubGroups.length }] : []),
    ...(canManage ? [{ id: 'boxers', label: 'Boxers', icon: 'boxers', count: regs.length }] : []),
    { id: 'registrations', label: 'Approvals', icon: 'checkCircle', count: pendingCount || undefined, attention: pendingCount > 0 },
    { id: 'weighins', label: 'Weigh-In', icon: 'scale', count: `${weighedCount}/${regs.length}` },
    ...(canManage ? [{ id: 'portals', label: 'Portals', icon: 'shield' }] : []),
  ]

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-5 py-6 text-white shadow-[0_30px_80px_-45px_rgba(2,6,23,0.9)] sm:px-7 sm:py-8">
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

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => navigate('/app/events')}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-slate-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
            >
              <Icon name="chevronRight" className="h-3.5 w-3.5 rotate-180" />
              All events
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300 ring-1 ring-inset ring-white/10">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live event console
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[26px] font-black leading-tight tracking-tight sm:text-4xl">{event.name}</h1>
                <StatusBadge status={event.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-300 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" className="h-4 w-4 text-slate-500" />
                  {fmtDate(event.eventDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="flag" className="h-4 w-4 text-slate-500" />
                  {[event.venue, event.location].filter(Boolean).join(' · ') || 'Venue TBA'}
                </span>
                {countdown && (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                      countdown === 'Passed'
                        ? 'bg-white/10 text-slate-400'
                        : countdown === 'Today'
                          ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30'
                          : 'bg-blue-400/15 text-blue-200 ring-1 ring-inset ring-blue-400/30'
                    )}
                  >
                    {countdown === 'Passed' ? 'Event passed' : countdown === 'Today' ? 'Event is today' : `In ${countdown}`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManage && (
                <select
                  value={event.status}
                  onChange={(e) => changeStatus(e.target.value)}
                  className="h-9 rounded-xl border border-white/15 bg-white/10 px-3 pr-8 text-xs font-bold text-white backdrop-blur-sm focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 [&>option]:text-slate-900"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              )}
              <Button variant="secondary" size="sm" className="h-9 border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={() => navigate(`/app/events/${id}/draws`)}>
                <Icon name="trophy" className="mr-1.5 h-3.5 w-3.5" />
                Draws
              </Button>
              <Button variant="secondary" size="sm" className="h-9 border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={() => navigate(`/app/events/${id}/results`)}>
                <Icon name="activity" className="mr-1.5 h-3.5 w-3.5" />
                Results
              </Button>
              {canManage && (
                <>
                  <Button variant="secondary" size="sm" className="h-9 border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={openEdit}>
                    <Icon name="settings" className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-rose-300 transition hover:bg-rose-500/15 hover:text-rose-200"
                  >
                    <Icon name="close" className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Inline health strip */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: 'Entries', value: regs.length, hint: `${pendingCount} awaiting review` },
              { label: 'Clubs', value: clubGroups.length, hint: `${assignedClubs.length} officially assigned` },
              { label: 'Weigh-in', value: `${weighPct}%`, hint: `${weighedCount} of ${regs.length} complete` },
              { label: 'Bouts drawn', value: boutCount, hint: 'Current fight card' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 backdrop-blur-sm">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{s.label}</p>
                <p className="mt-1 text-xl font-black leading-none text-white">{s.value}</p>
                <p className="mt-1 truncate text-[10px] font-medium text-slate-400">{s.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
              tab === t.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Icon name={t.icon} className={cn('h-4 w-4', tab === t.id ? 'text-white' : 'text-slate-400')} />
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none',
                  tab === t.id
                    ? 'bg-white/15 text-white'
                    : t.attention
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500'
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                label="Total entries"
                value={regs.length}
                sub={pendingCount ? `${pendingCount} pending approval` : 'All reviewed'}
                icon={<Icon name="registrations" className="h-5 w-5" />}
                tone="brand"
              />
              <StatCard
                label="Cleared to compete"
                value={eligibleCount}
                sub={`${approvalPct}% of entries processed`}
                icon={<Icon name="checkCircle" className="h-5 w-5" />}
                tone="emerald"
              />
              <StatCard
                label="Weigh-in complete"
                value={`${weighedCount}/${regs.length}`}
                sub={`${weighPct}% of the roster`}
                icon={<Icon name="scale" className="h-5 w-5" />}
                tone="violet"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <Panel className="lg:col-span-3" title="Entry pipeline" subtitle="Where every boxer currently sits" bodyClassName="px-5 py-5">
                <div className="flex flex-wrap items-center gap-6">
                  <DonutChart data={statusBuckets} centerLabel="Entries" centerValue={regs.length} size={164} thickness={15} />
                  <div className="min-w-[180px] flex-1 space-y-2.5">
                    {statusBuckets.length === 0 && <p className="text-xs text-slate-400">No entries yet.</p>}
                    {statusBuckets.map((b) => (
                      <div key={b.label} className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">{b.label}</span>
                        <span className="text-xs font-black text-slate-900">{b.value}</span>
                      </div>
                    ))}
                    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>Approval progress</span>
                        <span>{approvalPct}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-700" style={{ width: `${approvalPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel className="lg:col-span-2" title="Operations readiness" subtitle="Live event checklist">
                <div className="flex items-center justify-around gap-2">
                  <RadialProgress value={weighPct} label="weighed" size={116} stroke={10} color="#7c3aed" />
                  <RadialProgress value={approvalPct} label="cleared" size={116} stroke={10} color="#059669" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                    <p className="text-lg font-black text-slate-900">{genderSplit.male}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Male</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                    <p className="text-lg font-black text-slate-900">{genderSplit.female}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Female</p>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Event details" subtitle="Schedule and venue" bodyClassName="px-5 py-1">
                <dl className="divide-y divide-slate-100 text-sm">
                  <DetailRow label="Event date" value={fmtDate(event.eventDate)} icon="calendar" />
                  <DetailRow label="Venue" value={event.venue} icon="flag" />
                  <DetailRow label="Location" value={event.location} icon="globe" />
                  <DetailRow label="Weigh-in" value={fmtDate(event.weighInDate)} icon="scale" />
                  <DetailRow label="Registration deadline" value={fmtDate(event.registrationDeadline)} icon="clock" />
                </dl>
              </Panel>

              <Panel title="Competition setup" subtitle="Categories and rules">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Weight categories</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {event.weightCategories?.length
                        ? event.weightCategories.map((c) => <Badge key={c} tone="outline" className="px-2.5 py-1 text-[11px]">{c}</Badge>)
                        : <span className="text-xs text-slate-400">Not configured</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Age categories</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {event.ageCategories?.length
                        ? event.ageCategories.map((c) => <Badge key={c} tone="outline" className="px-2.5 py-1 text-[11px]">{c}</Badge>)
                        : <span className="text-xs text-slate-400">Not configured</span>}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className={cn('rounded-xl border px-3 py-2', event.requireWeighIn ? 'border-blue-100 bg-blue-50/60' : 'border-slate-200 bg-slate-50')}>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Weigh-in</p>
                      <p className={cn('mt-0.5 text-sm font-bold', event.requireWeighIn ? 'text-blue-700' : 'text-slate-600')}>
                        {event.requireWeighIn ? 'Required' : 'Not required'}
                      </p>
                    </div>
                    <div className={cn('rounded-xl border px-3 py-2', event.public ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-200 bg-slate-50')}>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Public listing</p>
                      <p className={cn('mt-0.5 text-sm font-bold', event.public ? 'text-emerald-700' : 'text-slate-600')}>
                        {event.public ? 'Visible' : 'Hidden'}
                      </p>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            <Panel
              title="Registration link"
              subtitle="Let clubs enter boxers directly into this event"
              action={
                <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', event.registrationOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                  {event.registrationOpen ? 'Open' : 'Closed'}
                </span>
              }
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Icon name="globe" className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-600">{registrationUrl}</span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={copyRegistration}>
                    <Icon name="download" className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                  {canManage && (event.registrationOpen ? (
                    <Button size="sm" variant="secondary" onClick={() => toggleRegistration(false)}>Close</Button>
                  ) : (
                    <Button size="sm" onClick={() => toggleRegistration(true)}>Open</Button>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Anyone with this link can submit boxers. You review and approve every entry from the Approvals tab.
              </p>
            </Panel>

            {event.rules && (
              <Panel title="Rules & requirements" subtitle="Shared with registered clubs">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{event.rules}</p>
                {event.registrationRequirements && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Registration requirements</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{event.registrationRequirements}</p>
                  </div>
                )}
              </Panel>
            )}
          </div>

          <div className="space-y-4">
            <Panel title="Quick actions" subtitle="Run the event from one place">
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/app/events/${id}/draws`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon name="trophy" className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-900">Build the draw</span>
                    <span className="block text-[10px] text-slate-500">{boutCount} bouts currently scheduled</span>
                  </span>
                  <Icon name="arrowRight" className="h-4 w-4 text-slate-300" />
                </button>
                <button
                  onClick={() => navigate(`/app/events/${id}/results`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Icon name="activity" className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-900">Record results</span>
                    <span className="block text-[10px] text-slate-500">Officials scorecard and outcomes</span>
                  </span>
                  <Icon name="arrowRight" className="h-4 w-4 text-slate-300" />
                </button>
                {canManage && (
                  <button
                    onClick={() => setTab('boxers')}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Icon name="usersPlus" className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-slate-900">Assign boxers</span>
                      <span className="block text-[10px] text-slate-500">{regs.length} entered · {pendingCount} awaiting review</span>
                    </span>
                    <Icon name="arrowRight" className="h-4 w-4 text-slate-300" />
                  </button>
                )}
                {canManage && (
                  <button
                    onClick={openEdit}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon name="settings" className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-slate-900">Edit event</span>
                      <span className="block text-[10px] text-slate-500">Dates, venue, categories, rules</span>
                    </span>
                    <Icon name="arrowRight" className="h-4 w-4 text-slate-300" />
                  </button>
                )}
              </div>
            </Panel>

            <Panel
              title="Club participation"
              subtitle="Entries by club in this event"
              action={canManage ? <button onClick={() => setTab('clubs')} className="text-[11px] font-bold text-brand-600 hover:text-brand-700">Manage</button> : null}
            >
              <BarList data={clubGroups.slice(0, 6).map((g) => ({ label: g.name, value: g.boxers.length }))} color="#0f766e" />
            </Panel>

            <Panel
              title="Weight classes"
              subtitle="Entry distribution"
              action={<Icon name="scale" className="h-4 w-4 text-slate-300" />}
            >
              <BarList data={weightDist} color="#4f46e5" />
            </Panel>

            <Panel title="Staff portals" subtitle="Read-only event access">
              <div className="space-y-2">
                {PORTAL_ROLES.map((cfg) => {
                  const link = (portals || []).find((p) => p.role === cfg.role)
                  return (
                    <div key={cfg.role} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <span className={cn('h-1.5 w-1.5 rounded-full', link?.active ? 'bg-emerald-500' : 'bg-slate-300')} />
                        {cfg.title}
                      </span>
                      <span className={cn('text-[10px] font-bold uppercase tracking-wide', link?.active ? 'text-emerald-600' : 'text-slate-400')}>
                        {link ? (link.active ? 'Active' : 'Disabled') : 'Not set'}
                      </span>
                    </div>
                  )
                })}
              </div>
              {canManage && (
                <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => setTab('portals')}>
                  Manage portal links
                  <Icon name="arrowRight" className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}
            </Panel>
          </div>
        </div>
      )}

      {tab === 'clubs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-bold text-slate-900">{assignedClubs.length} clubs assigned</p>
              <p className="text-[11px] text-slate-500">{regs.length} boxers entered across {clubGroups.length} participating clubs</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setClubFormOpen(true)}>
                <Icon name="plus" className="mr-1.5 h-3.5 w-3.5" />
                New club
              </Button>
              <Button size="sm" onClick={() => { setClubSearch(''); setAssignClubOpen(true) }}>
                <Icon name="clubs" className="mr-1.5 h-3.5 w-3.5" />
                Assign club
              </Button>
            </div>
          </div>

          {clubGroups.length === 0 ? (
            <Card>
              <Empty title="No clubs in this event yet" message="Assign a club first, then enter its boxers into the event." />
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {clubGroups.map((g) => (
                <article key={g.key} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-26px_rgba(15,23,42,0.4)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-[11px] font-black text-white shadow-sm">
                        {initials(g.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{g.name}</p>
                        <p className="truncate text-[11px] text-slate-500">{g.club?.contactName || (g.assigned ? 'Assigned club' : 'Joined via registration')}</p>
                      </div>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide', g.assigned ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                      {g.assigned ? 'Assigned' : 'Unlinked'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Boxers</p>
                      <p className="text-lg font-black leading-tight text-slate-900">{g.boxers.length}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Weighed</p>
                      <p className="text-lg font-black leading-tight text-slate-900">{g.boxers.filter((r) => r.weighIn?.status === 'successful').length}</p>
                    </div>
                  </div>

                  {(g.club?.contactEmail || g.club?.contactPhone) && (
                    <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                      {g.club?.contactEmail && (
                        <p className="flex items-center gap-1.5 truncate"><Icon name="mail" className="h-3.5 w-3.5 shrink-0 text-slate-400" />{g.club.contactEmail}</p>
                      )}
                      {g.club?.contactPhone && (
                        <p className="flex items-center gap-1.5 truncate"><Icon name="pulse" className="h-3.5 w-3.5 shrink-0 text-slate-400" />{g.club.contactPhone}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <button onClick={() => { setTab('boxers'); setClubFilter(g.key); setSearch('') }} className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-800">
                      View boxers
                      <Icon name="arrowRight" className="h-3.5 w-3.5" />
                    </button>
                    {g.assigned ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        disabled={clubBusy === g.club?._id}
                        onClick={() => removeClub(g.club._id)}
                      >
                        {clubBusy === g.club?._id ? 'Removing…' : 'Remove'}
                      </Button>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">From registration link</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'boxers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Assigned boxers', value: regs.length, icon: 'boxers', tone: 'bg-brand-50 text-brand-600' },
              { label: 'Male / Female', value: `${genderSplit.male} / ${genderSplit.female}`, icon: 'users', tone: 'bg-blue-50 text-blue-600' },
              { label: 'Weighed in', value: weighedCount, icon: 'scale', tone: 'bg-violet-50 text-violet-600' },
              { label: 'Awaiting approval', value: pendingCount, icon: 'clock', tone: 'bg-amber-50 text-amber-600' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', s.tone)}>
                  <Icon name={s.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{s.label}</p>
                  <p className="truncate text-lg font-black leading-tight text-slate-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
            <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10">
              <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search boxer, club or weight…"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              <option value="all">All clubs</option>
              {clubGroups.map((g) => (
                <option key={g.key} value={g.key}>{g.name}</option>
              ))}
            </select>
            <Button size="sm" onClick={openBoxerModal} disabled={!assignedClubs.length}>
              <Icon name="usersPlus" className="mr-1.5 h-3.5 w-3.5" />
              Assign boxer
            </Button>
          </div>

          {!assignedClubs.length && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <span className="flex items-center gap-2 font-semibold">
                <Icon name="alert" className="h-4 w-4" />
                Assign a club to this event before entering boxers.
              </span>
              <Button size="sm" variant="secondary" onClick={() => setTab('clubs')}>Go to clubs</Button>
            </div>
          )}

          {filteredRegs.length === 0 ? (
            <Card>
              <Empty
                title={regs.length === 0 ? 'No boxers assigned' : 'No matching boxers'}
                message={regs.length === 0 ? 'Assign a club, then add its boxers to this event.' : 'Try a different search or club filter.'}
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-5 py-3 font-bold">Boxer</th>
                      <th className="px-5 py-3 font-bold">Club</th>
                      <th className="px-5 py-3 font-bold">Category</th>
                      <th className="px-5 py-3 font-bold">Record</th>
                      <th className="px-5 py-3 font-bold">Weigh-in</th>
                      <th className="px-5 py-3 font-bold">Status</th>
                      <th className="px-5 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRegs.map((r) => (
                      <tr key={r._id} className="group transition hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-950 text-[10px] font-bold text-white">
                              {initials(r.boxerId?.fullName)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                              <p className="text-[11px] text-slate-500">
                                {r.boxerId?.gender === 'F' ? 'Female' : 'Male'}
                                {r.boxerId?.nationality ? ` · ${r.boxerId.nationality}` : ''}
                                {r.numberOfBouts > 1 ? ` · ${r.numberOfBouts} bouts` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <Icon name="clubs" className="h-3.5 w-3.5 text-slate-400" />
                            {r.boxerId?.clubName || r.clubName || 'Unattached'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {r.category?.weight && <Badge tone="blue" className="text-[10px]">{r.category.weight}</Badge>}
                            {r.category?.age && <Badge tone="slate" className="text-[10px]">{r.category.age}</Badge>}
                            {!r.category?.weight && !r.category?.age && <span className="text-xs text-slate-400">—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700">
                            <span className="text-emerald-600">{r.boxerId?.boxingRecord?.wins || 0}W</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-rose-500">{r.boxerId?.boxingRecord?.losses || 0}L</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-500">{r.boxerId?.boxingRecord?.draws || 0}D</span>
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={r.weighIn?.status} />
                            {r.weighIn?.officialWeightKg ? <span className="text-[10px] font-bold text-slate-600">{r.weighIn.officialWeightKg} kg</span> : null}
                          </div>
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.weighIn?.status !== 'successful' ? (
                              <button
                                onClick={() => { setWeighReg(r); setWeighWeight(r.boxerId?.registeredWeightKg || ''); setWeighNotes('') }}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                              >
                                Weigh in
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600">Cleared</span>
                            )}
                            <button
                              onClick={() => removeReg(r)}
                              className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-50"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'registrations' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-bold text-slate-900">Approval queue</p>
              <p className="text-[11px] text-slate-500">{pendingCount} entries need a decision · {regs.length} total</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setTab('boxers')}>
                <Icon name="boxers" className="mr-1.5 h-3.5 w-3.5" />
                Assigned boxers
              </Button>
              <Button size="sm" variant="secondary" onClick={() => navigate('/app/registrations')}>
                <Icon name="external" className="mr-1.5 h-3.5 w-3.5" />
                All registrations
              </Button>
            </div>
          </div>

          {regs.length === 0 ? (
            <Card>
              <Empty title="No registrations yet" message="Share the registration link to get boxers signed up." />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-5 py-3 font-bold">Boxer</th>
                      <th className="px-5 py-3 font-bold">Club</th>
                      <th className="px-5 py-3 font-bold">Category</th>
                      <th className="px-5 py-3 font-bold">Status</th>
                      <th className="px-5 py-3 text-right font-bold">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {regs.map((r) => (
                      <tr key={r._id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-bold text-white">
                              {initials(r.boxerId?.fullName)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                              {r.promoterFeedback && <p className="max-w-56 truncate text-[11px] text-slate-500">Feedback: {r.promoterFeedback}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">{r.boxerId?.clubName || r.clubName || '—'}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {categoryLabel(r).length === 0
                              ? <span className="text-xs text-slate-400">—</span>
                              : categoryLabel(r).map((c) => (
                                  <span key={c} className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">{c}</span>
                                ))}
                          </div>
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {['pending_approval', 'needs_correction'].includes(r.status) ? (
                              <>
                                <Button size="sm" onClick={() => { setActionReg(r); setAction('approve') }}>Approve</Button>
                                <Button size="sm" variant="secondary" onClick={() => { setActionReg(r); setAction('needs_correction') }}>Change</Button>
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
            </Card>
          )}
        </div>
      )}

      {tab === 'weighins' && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">Weigh-in progress</p>
                  <p className="text-[11px] text-slate-500">{weighedCount} of {regs.length} boxers have a successful official weigh-in</p>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{weighPct}%</span>
              </div>
              <div className="px-5 pb-5">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700" style={{ width: `${weighPct}%` }} />
                </div>
              </div>
            </Card>
            <Card className="flex items-center justify-center gap-5 px-5 py-4">
              <RadialProgress value={weighPct} label="complete" size={120} stroke={10} color="#7c3aed" />
            </Card>
          </div>

          <Card className="overflow-hidden">
            {regs.length === 0 ? (
              <Empty title="No boxers to weigh in" message="Assign boxers to this event first." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-5 py-3 font-bold">Boxer</th>
                      <th className="px-5 py-3 font-bold">Club</th>
                      <th className="px-5 py-3 font-bold">Official weight</th>
                      <th className="px-5 py-3 font-bold">Weighed</th>
                      <th className="px-5 py-3 font-bold">Weigh-in</th>
                      <th className="px-5 py-3 font-bold">Status</th>
                      <th className="px-5 py-3 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {regs.map((r) => (
                      <tr key={r._id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-bold text-white">
                              {initials(r.boxerId?.fullName)}
                            </span>
                            <span className="font-bold text-slate-900">{r.boxerId?.fullName || 'Boxer'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">{r.boxerId?.clubName || r.clubName || '—'}</td>
                        <td className="px-5 py-3 font-bold text-slate-900">{r.weighIn?.officialWeightKg ? `${r.weighIn.officialWeightKg} kg` : '—'}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500">
                          {r.weighIn?.weighedAt ? fmtShort(r.weighIn.weighedAt) : '—'}
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={r.weighIn?.status} /></td>
                        <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.weighIn?.status !== 'successful' ? (
                              <Button size="sm" variant="secondary" onClick={() => { setWeighReg(r); setWeighWeight(r.boxerId?.registeredWeightKg || ''); setWeighNotes('') }}>
                                Record weight
                              </Button>
                            ) : (
                              <>
                                {r.status !== 'eligible' && (
                                  <Button size="sm" onClick={() => { setActionReg(r); setAction('mark_eligible') }}>Mark eligible</Button>
                                )}
                                <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('mark_ineligible') }}>Not eligible</Button>
                              </>
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
        </div>
      )}

      {tab === 'portals' && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900">Staff portals</h3>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
              Generate a read-only link for each role and send it directly to the person. Nobody needs an account, and the link
              stops working the moment you disable, regenerate or remove it.
            </p>
          </Card>
          <div className="grid gap-3 lg:grid-cols-2">
            {PORTAL_ROLES.map((cfg) => {
              const link = (portals || []).find((p) => p.role === cfg.role)
              const isBusy = portalBusy === cfg.role
              return (
                <Card key={cfg.role} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{cfg.title} portal</h4>
                      <p className="text-[11px] text-slate-500">{cfg.desc}</p>
                    </div>
                    {link && (
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold', link.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', link.active ? 'bg-emerald-500' : 'bg-slate-300')} />
                        {link.active ? 'Active' : 'Disabled'}
                      </span>
                    )}
                  </div>
                  {link ? (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <Icon name="globe" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-600">{portalUrl(link.token)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => copyPortal(link.token)}>Copy link</Button>
                        <Button size="sm" variant="secondary" disabled={isBusy} onClick={() => portalAction(cfg.role, 'regenerate', 'Generate a new link? The old link will stop working immediately.')}>
                          {isBusy ? 'Working…' : 'New link'}
                        </Button>
                        <Button size="sm" variant="secondary" disabled={isBusy} onClick={() => portalAction(cfg.role, 'toggle')}>
                          {link.active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button size="sm" variant="danger" disabled={isBusy} onClick={() => portalAction(cfg.role, 'remove', 'Remove this portal link permanently?')}>
                          Remove
                        </Button>
                      </div>
                      {link.lastUsedAt && <p className="mt-3 text-[10px] text-slate-400">Last opened {new Date(link.lastUsedAt).toLocaleString()}</p>}
                    </div>
                  ) : (
                    <Button className="mt-4" size="sm" disabled={isBusy} onClick={() => portalAction(cfg.role, 'create')}>
                      {isBusy ? 'Creating…' : 'Create link'}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Assign club modal */}
      <Modal
        open={assignClubOpen}
        onClose={() => setAssignClubOpen(false)}
        title="Assign a club to this event"
        size="lg"
        footer={<Button variant="secondary" onClick={() => setAssignClubOpen(false)}>Done</Button>}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10">
            <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              placeholder="Search the club directory…"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {availableDirectory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-bold text-slate-700">{directory.length === 0 ? 'No clubs in the directory yet' : 'All matching clubs are already assigned'}</p>
              <p className="mt-1 text-xs text-slate-500">Create a club profile to start assigning its boxers.</p>
              <Button size="sm" className="mt-3" onClick={() => { setAssignClubOpen(false); setClubFormOpen(true) }}>
                <Icon name="plus" className="mr-1.5 h-3.5 w-3.5" />
                Create club
              </Button>
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {availableDirectory.map((c) => (
                <div key={c._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-[10px] font-black text-white">
                      {initials(c.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900">{c.name}</p>
                      <p className="truncate text-[10px] text-slate-500">{c.contactName || c.contactEmail || 'No contact on file'}</p>
                    </div>
                  </div>
                  <Button size="sm" disabled={clubBusy === c._id} onClick={() => assignClub(c._id)}>
                    {clubBusy === c._id ? 'Adding…' : 'Assign'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setAssignClubOpen(false); setClubFormOpen(true) }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-[11px] font-bold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            Create a new club instead
          </button>
        </div>
      </Modal>

      {/* Create club modal */}
      <Modal
        open={clubFormOpen}
        onClose={() => setClubFormOpen(false)}
        title="Create a club"
        footer={
          <>
            <Button variant="secondary" onClick={() => setClubFormOpen(false)}>Cancel</Button>
            <Button onClick={createClub} disabled={clubSaving}>{clubSaving ? <Spinner className="h-4 w-4 border-white" /> : 'Create & assign'}</Button>
          </>
        }
      >
        <form onSubmit={createClub} className="space-y-4">
          <Input label="Club name" value={clubForm.name} onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })} required placeholder="e.g. Iron Fist Boxing Club" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Contact person" value={clubForm.contactName} onChange={(e) => setClubForm({ ...clubForm, contactName: e.target.value })} />
            <Input label="Contact phone" value={clubForm.contactPhone} onChange={(e) => setClubForm({ ...clubForm, contactPhone: e.target.value })} />
          </div>
          <Input label="Contact email" type="email" value={clubForm.contactEmail} onChange={(e) => setClubForm({ ...clubForm, contactEmail: e.target.value })} />
          <Input label="Address" value={clubForm.address} onChange={(e) => setClubForm({ ...clubForm, address: e.target.value })} />
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            This creates the club profile and assigns it to this event. A login account can be added later from Users.
          </p>
        </form>
      </Modal>

      {/* Assign boxer modal */}
      <Modal
        open={boxerModal}
        onClose={() => setBoxerModal(false)}
        title="Assign a boxer to this event"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBoxerModal(false)}>Cancel</Button>
            <Button onClick={assignBoxer} disabled={boxerSaving}>{boxerSaving ? <Spinner className="h-4 w-4 border-white" /> : 'Assign boxer'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Club"
            value={boxerClubId}
            onChange={(e) => { setBoxerClubId(e.target.value); setBoxerPickId('') }}
          >
            <option value="">Select an assigned club</option>
            {assignedClubs.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setBoxerMode('existing')}
              className={cn('rounded-lg px-3 py-2 text-xs font-bold transition', boxerMode === 'existing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
            >
              Existing boxer
            </button>
            <button
              type="button"
              onClick={() => setBoxerMode('new')}
              className={cn('rounded-lg px-3 py-2 text-xs font-bold transition', boxerMode === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
            >
              New boxer
            </button>
          </div>

          {boxerMode === 'existing' ? (
            <div>
              <Select label="Boxer" value={boxerPickId} onChange={(e) => setBoxerPickId(e.target.value)} disabled={clubBoxersLoading}>
                <option value="">{clubBoxersLoading ? 'Loading club roster…' : 'Select a boxer from this club'}</option>
                {availableBoxers.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.fullName}{b.weightCategory ? ` — ${b.weightCategory}` : ''}{b.gender ? ` (${b.gender === 'M' ? 'M' : 'F'})` : ''}
                  </option>
                ))}
              </Select>
              {!clubBoxersLoading && boxerClubId && availableBoxers.length === 0 && (
                <p className="mt-2 text-[11px] text-slate-500">No unassigned boxers in this club. Create a new boxer instead.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Input label="Full name" value={newBoxer.fullName} onChange={(e) => setNewBoxer({ ...newBoxer, fullName: e.target.value })} placeholder="Boxer's full name" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Gender" value={newBoxer.gender} onChange={(e) => setNewBoxer({ ...newBoxer, gender: e.target.value })}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </Select>
                <Input label="Date of birth" type="date" value={newBoxer.dateOfBirth} onChange={(e) => setNewBoxer({ ...newBoxer, dateOfBirth: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Registered weight (kg)" type="number" step="0.1" value={newBoxer.registeredWeightKg} onChange={(e) => setNewBoxer({ ...newBoxer, registeredWeightKg: e.target.value })} />
                <Input label="Experience" value={newBoxer.experience} onChange={(e) => setNewBoxer({ ...newBoxer, experience: e.target.value })} placeholder="e.g. Amateur, 3 years" />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Event category</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <CategoryField label="Weight" value={boxerCat.weight} onChange={(e) => setBoxerCat({ ...boxerCat, weight: e.target.value })} options={event.weightCategories} placeholder="e.g. 60kg" />
              <CategoryField label="Age" value={boxerCat.age} onChange={(e) => setBoxerCat({ ...boxerCat, age: e.target.value })} options={event.ageCategories} placeholder="e.g. Junior" />
              <Select label="Gender category" value={boxerCat.gender} onChange={(e) => setBoxerCat({ ...boxerCat, gender: e.target.value })}>
                <option value="">Use boxer's gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Mixed">Mixed</option>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Weigh-in modal */}
      <Modal
        open={!!weighReg}
        onClose={() => setWeighReg(null)}
        title={`Record weigh-in — ${weighReg?.boxerId?.fullName || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setWeighReg(null)}>Cancel</Button>
            <Button onClick={recordWeight} disabled={busy}>Record weight</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Official weight (kg)" type="number" step="0.1" value={weighWeight} onChange={(e) => setWeighWeight(e.target.value)} required />
          <Textarea label="Notes (optional)" value={weighNotes} onChange={(e) => setWeighNotes(e.target.value)} rows={2} placeholder="Any notes for the officials" />
        </div>
      </Modal>

      {/* Approval action modal */}
      <Modal
        open={!!actionReg}
        onClose={() => setActionReg(null)}
        title={
          {
            approve: 'Approve registration',
            reject: 'Reject registration',
            needs_correction: 'Request correction',
            mark_eligible: 'Mark boxer eligible',
            mark_ineligible: 'Mark boxer not eligible',
          }[action] || 'Action'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionReg(null)}>Cancel</Button>
            <Button onClick={runAction} disabled={busy} variant={action.includes('reject') ? 'danger' : 'primary'}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {actionReg?.boxerId?.fullName} — {actionReg?.boxerId?.clubName || actionReg?.clubName}
        </p>
        <div className="mt-4">
          <Textarea label="Feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="Optional note to the club" />
        </div>
      </Modal>

      {/* Edit event modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit event details"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy}>{busy ? <Spinner className="h-4 w-4 border-white" /> : 'Save changes'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Event name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          <Textarea label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Venue" value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} />
            <Input label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Event date" type="date" value={editForm.eventDate} onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })} />
            <Input label="Registration opens" type="date" value={editForm.registrationOpens} onChange={(e) => setEditForm({ ...editForm, registrationOpens: e.target.value })} />
            <Input label="Registration deadline" type="date" value={editForm.registrationDeadline} onChange={(e) => setEditForm({ ...editForm, registrationDeadline: e.target.value })} />
            <Input label="Weigh-in date" type="date" value={editForm.weighInDate} onChange={(e) => setEditForm({ ...editForm, weighInDate: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TagInput label="Weight categories" placeholder="e.g. 60kg" values={editWeightCategories} setValues={setEditWeightCategories} />
            <TagInput label="Age categories" placeholder="e.g. Junior" values={editAgeCategories} setValues={setEditAgeCategories} />
          </div>
          <Textarea label="Competition rules" value={editForm.rules} onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })} rows={2} />
          <Textarea label="Registration requirements" value={editForm.registrationRequirements} onChange={(e) => setEditForm({ ...editForm, registrationRequirements: e.target.value })} rows={2} />
          <div className="border-t border-slate-200 pt-4">
            <p className="mb-2 text-xs font-bold text-slate-900">Settings</p>
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
