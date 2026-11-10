import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Input, Select, Textarea } from '../../components/Field.jsx'
import { Icon } from '../../components/Icons.jsx'
import { cn } from '../../utils/cn.js'
import {
  emptyProBoxerForm,
  proBoxerFormFrom,
  proBoxerPayload,
  ProBoxerFields,
} from '../../components/ProBoxerForm.jsx'

const CORNERS = [
  { value: 'red', label: 'Red corner' },
  { value: 'blue', label: 'Blue corner' },
  { value: 'neutral', label: 'Neutral' },
]

const BILLING = [
  { value: 'main_event', label: 'Main event' },
  { value: 'co_main', label: 'Co-main event' },
  { value: 'undercard', label: 'Undercard' },
  { value: 'prelim', label: 'Preliminary' },
  { value: 'reserve', label: 'Reserve' },
]

const ENTRY_STATUS = ['confirmed', 'pending', 'withdrawn', 'replaced']

const emptyEntryForm = {
  corner: 'red',
  billing: 'undercard',
  contractedWeightKg: '',
  scheduledRounds: '',
  walkoutMusic: '',
  colors: '',
  teamPasses: '',
  status: 'confirmed',
  titleOnLine: false,
  titleName: '',
  sanctioningBody: '',
}

const emptyEventForm = {
  name: '',
  description: '',
  venue: '',
  location: '',
  eventDate: '',
  rules: '',
  public: false,
  seriesName: '',
  eventNumber: '',
  tagline: '',
  posterUrl: '',
  promotionName: '',
  sanctioningBody: '',
  broadcastNetwork: '',
  broadcastStreamUrl: '',
  payPerView: false,
  ticketingUrl: '',
  ticketingCurrency: 'USD',
  ticketingPriceFrom: '',
  doorsOpen: '',
  firstBell: '',
  weighInVenue: '',
  rulesMeetingAt: '',
  medicalOfficer: '',
  matchmaker: '',
  ringAnnouncer: '',
  capacity: '',
}

function eventFormFrom(ev = {}) {
  const pro = ev.pro || {}
  return {
    name: ev.name || '',
    description: ev.description || '',
    venue: ev.venue || '',
    location: ev.location || '',
    eventDate: ev.eventDate ? String(ev.eventDate).slice(0, 10) : '',
    rules: ev.rules || '',
    public: Boolean(ev.public),
    seriesName: pro.seriesName || '',
    eventNumber: pro.eventNumber ?? '',
    tagline: pro.tagline || '',
    posterUrl: pro.posterUrl || '',
    promotionName: pro.promotionName || '',
    sanctioningBody: pro.sanctioningBody || '',
    broadcastNetwork: pro.broadcast?.network || '',
    broadcastStreamUrl: pro.broadcast?.streamUrl || '',
    payPerView: Boolean(pro.broadcast?.payPerView),
    ticketingUrl: pro.ticketing?.url || '',
    ticketingCurrency: pro.ticketing?.currency || 'USD',
    ticketingPriceFrom: pro.ticketing?.priceFrom ?? '',
    doorsOpen: pro.doorsOpen || '',
    firstBell: pro.firstBell || '',
    weighInVenue: pro.weighInVenue || '',
    rulesMeetingAt: pro.rulesMeetingAt ? String(pro.rulesMeetingAt).slice(0, 10) : '',
    medicalOfficer: pro.medicalOfficer || '',
    matchmaker: pro.matchmaker || '',
    ringAnnouncer: pro.ringAnnouncer || '',
    capacity: pro.capacity ?? '',
  }
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function flagOf(code = '') {
  const c = String(code || '').toUpperCase()
  if (c.length < 2) return ''
  return String.fromCodePoint(127397 + c.charCodeAt(0)) + String.fromCodePoint(127397 + c.charCodeAt(1))
}

function fmtDate(iso) {
  if (!iso) return 'Date TBA'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Date TBA'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function recordText(boxer) {
  const r = (boxer?.professional || {}).record || {}
  return `${r.wins || 0}-${r.losses || 0}-${r.draws || 0}${r.koWins ? ` · ${r.koWins} KO` : ''}`
}

const boutLabel = (b) => {
  if (b.boutType === 'main_event') return 'Main event'
  if (b.boutType === 'co_main') return 'Co-main'
  if (b.boutType === 'prelim') return 'Preliminary'
  return 'Undercard'
}

export default function ProEventCockpit({ event, canManage = false }) {
  const id = event?._id
  const navigate = useNavigate()
  const { toast } = useToast()

  const [eventData, setEventData] = useState(event)
  const [entries, setEntries] = useState(null)
  const [bouts, setBouts] = useState([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(event?.status || 'draft')

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [eventSaving, setEventSaving] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...emptyProBoxerForm })
  const [entryForm, setEntryForm] = useState({ ...emptyEntryForm })
  const [saving, setSaving] = useState(false)

  const [attachOpen, setAttachOpen] = useState(false)
  const [globalBoxers, setGlobalBoxers] = useState(null)
  const [attachId, setAttachId] = useState('')
  const [attaching, setAttaching] = useState(false)

  const load = async () => {
    if (!id) return
    try {
      const [roster, draw] = await Promise.all([
        api(`/pro-roster?eventId=${id}`),
        api(`/draws/get?eventId=${id}`),
      ])
      setEntries(roster.entries || [])
      setBouts(draw.bouts || [])
    } catch (err) {
      toast(err.message, 'error')
      setEntries([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const pro = eventData?.pro || {}
  const roster = useMemo(
    () => (entries || []).map((e) => ({ ...e, boxer: e.boxerId || {} })),
    [entries]
  )
  const orderedBouts = useMemo(
    () =>
      [...(bouts || [])]
        .filter((b) => b.boxerAId?.boxerId || b.boxerBId?.boxerId)
        .sort((a, b) => {
          const ao = a.billingOrder ?? 999
          const bo = b.billingOrder ?? 999
          if (ao !== bo) return ao - bo
          return (a.boutNumber || 0) - (b.boutNumber || 0)
        }),
    [bouts]
  )
  const titleFights = orderedBouts.filter((b) => b.titleFight).length
  const mainEvent = orderedBouts[0]

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyProBoxerForm })
    setEntryForm({ ...emptyEntryForm })
    setModalOpen(true)
  }

  const openEdit = (entry) => {
    setEditing(entry)
    setForm(proBoxerFormFrom(entry.boxerId || {}))
    setEntryForm({ ...emptyEntryForm, ...(entry.proEntry || {}) })
    setModalOpen(true)
  }

  const entryPayload = () => ({
    corner: entryForm.corner || 'red',
    billing: entryForm.billing || 'undercard',
    contractedWeightKg: entryForm.contractedWeightKg ? Number(entryForm.contractedWeightKg) : null,
    division: form.division || form.weightCategory || '',
    scheduledRounds: entryForm.scheduledRounds ? Number(entryForm.scheduledRounds) : null,
    walkoutMusic: entryForm.walkoutMusic || '',
    colors: entryForm.colors || '',
    teamPasses: entryForm.teamPasses ? Number(entryForm.teamPasses) : 0,
    status: entryForm.status || 'confirmed',
    titleOnLine: Boolean(entryForm.titleOnLine),
    titleName: entryForm.titleName || '',
    sanctioningBody: entryForm.sanctioningBody || pro.sanctioningBody || '',
  })

  const save = async (e) => {
    e?.preventDefault?.()
    if (!form.fullName.trim()) {
      toast('Enter the fighter name', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = proBoxerPayload(form, editing?.boxerId?.professional?.titles || [])
      if (editing) {
        await api(`/boxers?id=${editing.boxerId._id}`, { method: 'PUT', body: payload })
        await api(`/pro-roster?id=${editing._id}`, { method: 'PUT', body: { proEntry: entryPayload() } })
        toast('Fighter updated')
      } else {
        await api('/pro-roster', {
          method: 'POST',
          body: {
            eventId: id,
            boxer: payload,
            category: {
              weight: form.division || form.weightCategory || '',
              gender: form.gender || '',
              age: form.ageCategory || '',
            },
            proEntry: entryPayload(),
          },
        })
        toast('Fighter added to the fight night')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const removeEntry = async (entry) => {
    const name = entry.boxerId?.fullName || entry.boxer?.fullName || 'this fighter'
    if (!window.confirm(`Remove ${name} from this fight night? Their fight-card bouts will also be deleted.`)) return
    setBusy(true)
    try {
      await api(`/pro-roster?id=${entry._id}`, { method: 'DELETE' })
      toast('Fighter removed from the card')
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const openAttach = async () => {
    setAttachOpen(true)
    setAttachId('')
    setGlobalBoxers(null)
    try {
      const d = await api('/boxers?boxerType=professional')
      setGlobalBoxers(d.boxers || [])
    } catch (err) {
      toast(err.message, 'error')
      setGlobalBoxers([])
    }
  }

  const attachedIds = useMemo(() => new Set(roster.map((e) => String(e.boxerId?._id || e.boxer?._id))), [roster])
  const attachable = useMemo(
    () => (globalBoxers || []).filter((b) => !attachedIds.has(String(b._id))),
    [globalBoxers, attachedIds]
  )

  const attachExisting = async () => {
    if (!attachId) {
      toast('Select a professional boxer', 'error')
      return
    }
    setAttaching(true)
    try {
      await api('/pro-roster', {
        method: 'POST',
        body: {
          eventId: id,
          boxerId: attachId,
          category: { weight: '', gender: '', age: '' },
          proEntry: { corner: 'red', billing: 'undercard' },
        },
      })
      toast('Fighter attached to the fight night')
      setAttachOpen(false)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setAttaching(false)
    }
  }

  const changeStatus = async (next) => {
    try {
      await api(`/events/update?id=${id}`, { method: 'PATCH', body: { status: next } })
      setStatus(next)
      toast('Event status updated')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const openEditEvent = () => {
    setEditForm(eventFormFrom(eventData))
    setEditOpen(true)
  }

  const setEdit = (key) => (e) => setEditForm({ ...editForm, [key]: e.target.value })
  const setEditChecked = (key) => (e) => setEditForm({ ...editForm, [key]: e.target.checked })

  const saveEvent = async (e) => {
    e?.preventDefault?.()
    if (!editForm?.name?.trim()) {
      toast('Event name is required', 'error')
      return
    }
    setEventSaving(true)
    try {
      const currentPro = eventData?.pro || {}
      const proPayload = {
        ...currentPro,
        seriesName: editForm.seriesName,
        eventNumber: editForm.eventNumber !== '' ? Number(editForm.eventNumber) : null,
        tagline: editForm.tagline,
        posterUrl: editForm.posterUrl,
        promotionName: editForm.promotionName,
        sanctioningBody: editForm.sanctioningBody,
        broadcast: {
          ...(currentPro.broadcast || {}),
          network: editForm.broadcastNetwork,
          streamUrl: editForm.broadcastStreamUrl,
          payPerView: Boolean(editForm.payPerView),
        },
        ticketing: {
          ...(currentPro.ticketing || {}),
          url: editForm.ticketingUrl,
          currency: editForm.ticketingCurrency || 'USD',
          priceFrom: editForm.ticketingPriceFrom !== '' ? Number(editForm.ticketingPriceFrom) : null,
        },
        doorsOpen: editForm.doorsOpen,
        firstBell: editForm.firstBell,
        weighInVenue: editForm.weighInVenue,
        rulesMeetingAt: editForm.rulesMeetingAt ? new Date(editForm.rulesMeetingAt) : null,
        medicalOfficer: editForm.medicalOfficer,
        matchmaker: editForm.matchmaker,
        ringAnnouncer: editForm.ringAnnouncer,
        capacity: editForm.capacity !== '' ? Number(editForm.capacity) : null,
      }
      const res = await api(`/events/update?id=${id}`, {
        method: 'PATCH',
        body: {
          name: editForm.name.trim(),
          description: editForm.description,
          venue: editForm.venue,
          location: editForm.location,
          eventDate: editForm.eventDate ? new Date(editForm.eventDate) : null,
          rules: editForm.rules,
          public: Boolean(editForm.public),
          pro: proPayload,
        },
      })
      if (res.event) {
        setEventData(res.event)
        setStatus(res.event.status || status)
      }
      setEditOpen(false)
      toast('Fight night updated')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setEventSaving(false)
    }
  }

  if (!entries) return <Loading />

  return (
    <div className="space-y-5">
      {/* ── Fight night hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#08080f] text-white shadow-[0_35px_90px_-50px_rgba(0,0,0,0.95)]">
        {pro.posterUrl && (
          <img src={pro.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080f] via-[#08080f]/95 to-[#08080f]/40" />
        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-rose-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => navigate('/app/events')}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-slate-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
            >
              <Icon name="chevronRight" className="h-3.5 w-3.5 rotate-180" />
              All events
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                <Icon name="trophy" className="h-3 w-3" />
                Pro fight night
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300 ring-1 ring-inset ring-white/10">
                {status}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              {(pro.seriesName || pro.eventNumber) && (
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-400">
                  {[pro.seriesName, pro.eventNumber ? `Event ${pro.eventNumber}` : ''].filter(Boolean).join(' · ')}
                </p>
              )}
              <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight sm:text-5xl">{eventData?.name || 'Fight night'}</h1>
              {(pro.promotionName || pro.tagline) && (
                <p className="mt-2 text-sm font-medium text-amber-200/90">
                  {[pro.promotionName, pro.tagline].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-300 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" className="h-4 w-4 text-slate-500" />
                  {fmtDate(eventData?.eventDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="flag" className="h-4 w-4 text-slate-500" />
                  {[eventData?.venue, eventData?.location].filter(Boolean).join(' · ') || 'Venue TBA'}
                </span>
                {pro.sanctioningBody && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="shield" className="h-4 w-4 text-slate-500" />
                    {pro.sanctioningBody}
                  </span>
                )}
                {pro.firstBell && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="clock" className="h-4 w-4 text-slate-500" />
                    First bell {pro.firstBell}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManage && (
                <select
                  value={status}
                  onChange={(e) => changeStatus(e.target.value)}
                  className="h-10 rounded-xl border border-white/15 bg-white/10 px-3 pr-8 text-xs font-bold text-white backdrop-blur-sm focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 [&>option]:text-slate-900"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              )}
              {canManage && (
                <Button
                  variant="secondary"
                  className="h-10 border-white/15 bg-white/10 text-white hover:bg-white/15"
                  onClick={openEditEvent}
                >
                  <Icon name="settings" className="mr-1.5 h-4 w-4" />
                  Edit fight night
                </Button>
              )}
              {canManage && (
                <Button
                  onClick={openAdd}
                  className="h-10 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 px-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-amber-400"
                >
                  <Icon name="plus" className="mr-1.5 h-4 w-4" />
                  Add fighter
                </Button>
              )}
              <Button
                variant="secondary"
                className="h-10 border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={() => navigate(`/app/events/${id}/draws`)}
              >
                <Icon name="trophy" className="mr-1.5 h-4 w-4" />
                Build fight card
              </Button>
              <Button
                variant="secondary"
                className="h-10 border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={() => navigate(`/app/events/${id}/results`)}
              >
                <Icon name="activity" className="mr-1.5 h-4 w-4" />
                Results
              </Button>
              <Button
                variant="secondary"
                className="h-10 border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={() => {
                  if (!eventData?.public) {
                    toast('Turn on “Show this fight night on the public site” in Edit fight night first', 'error')
                    return
                  }
                  window.open(`/events/${id}`, '_blank')
                }}
              >
                <Icon name="external" className="mr-1.5 h-4 w-4" />
                Public page
              </Button>
              {pro.ticketing?.url && (
                <a
                  href={pro.ticketing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
                >
                  <Icon name="external" className="h-4 w-4" />
                  Tickets
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Fighters signed', value: roster.length, hint: 'Manager-added roster' },
          { label: 'Bouts booked', value: orderedBouts.length, hint: 'On the fight card' },
          { label: 'Title fights', value: titleFights, hint: titleFights ? 'Championship bouts' : 'No titles on the line' },
          { label: 'Main event', value: mainEvent ? 'Set' : 'Open', hint: mainEvent ? 'Billing locked' : 'Book the headliner' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">{s.label}</p>
            <p className="mt-1 text-xl font-black leading-none text-slate-900">{s.value}</p>
            <p className="mt-1 truncate text-[10px] font-medium text-slate-500">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* ── How this works ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-white to-rose-50/60 px-4 py-4 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: '1', title: 'Sign your fighters', text: 'Add every professional boxer with photos, record, rankings, team and medicals. No clubs, no public registrations.' },
            { n: '2', title: 'Build the card yourself', text: 'Pair fighters manually and set main event, co-main, undercard, rounds and title bouts.' },
            { n: '3', title: 'Record official results', text: 'Enter pro methods, scorecards, knockdowns and title changes — careers update automatically.' },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-amber-400">{s.n}</span>
              <div>
                <p className="text-xs font-black text-slate-900">{s.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Roster ───────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-900">
              <Icon name="boxers" className="h-4 w-4 text-rose-600" />
              Fighters on this card
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Promoter-managed roster — every fighter profile lives here, no registrations needed.</p>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={openAttach}>
                <Icon name="usersPlus" className="mr-1.5 h-3.5 w-3.5" />
                Attach existing
              </Button>
              <Button size="sm" onClick={openAdd}>
                <Icon name="plus" className="mr-1.5 h-3.5 w-3.5" />
                Add fighter
              </Button>
            </div>
          )}
        </div>

        {roster.length === 0 ? (
          <div className="console-card">
            <Empty
              title="No fighters signed yet"
              message="Add professional boxers with their full profiles — photos, country flag, record, rankings and team details."
              action={
                canManage ? (
                  <Button onClick={openAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white">
                    <Icon name="plus" className="h-4 w-4" />
                    Add the first fighter
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {roster.map((entry) => {
              const b = entry.boxer || {}
              const bp = b.professional || {}
              const pe = entry.proEntry || {}
              const headshot = bp.photos?.headshotUrl || b.photoUrl
              const titles = (bp.titles || []).filter((t) => t.current).map((t) => t.title).filter(Boolean)
              return (
                <article key={entry._id} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_45px_-28px_rgba(15,23,42,0.4)]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />
                  <div className="flex items-start gap-3 p-4">
                    {headshot ? (
                      <img src={headshot} alt={b.fullName || 'Fighter'} className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-white shadow" />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-black text-amber-400 shadow">
                        {initials(b.fullName || '?')}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {bp.photos?.countryFlagUrl ? (
                          <img src={bp.photos.countryFlagUrl} alt="" className="h-3 w-5 rounded-sm object-cover" />
                        ) : (
                          <span className="text-xs">{flagOf(bp.countryCode)}</span>
                        )}
                        <p className="truncate text-sm font-black text-slate-900">{b.fullName || 'Fighter'}</p>
                      </div>
                      {bp.ringName && <p className="truncate text-[11px] font-semibold italic text-rose-600">{bp.ringName}</p>}
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {[bp.division || b.weightCategory || 'Division TBA', bp.country || b.nationality].filter(Boolean).join(' · ')}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-600">{recordText(b)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 px-4">
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Corner</p>
                      <p className="text-[10px] font-black uppercase text-slate-800">{pe.corner || '—'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Billing</p>
                      <p className="text-[10px] font-black uppercase text-slate-800">{String(pe.billing || '—').replace('_', ' ')}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Rounds</p>
                      <p className="text-[10px] font-black uppercase text-slate-800">{pe.scheduledRounds || '—'}</p>
                    </div>
                  </div>

                  {titles.length > 0 && (
                    <div className="mx-4 mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 ring-1 ring-inset ring-amber-200">
                      <p className="truncate text-[10px] font-bold text-amber-800">🏆 {titles.join(', ')}</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{pe.status || 'confirmed'}</span>
                    <div className="flex items-center gap-1">
                      {canManage && (
                        <button onClick={() => openEdit(entry)} className="rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-100">
                          Edit
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => removeEntry(entry)} disabled={busy} className="rounded-lg px-2 py-1 text-[10px] font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-40">
                          Remove
                        </button>
                      )}
                      <a
                        href={`/boxer/${b._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg px-2 py-1 text-[10px] font-bold text-brand-700 transition hover:bg-brand-50"
                      >
                        Profile
                      </a>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Fight card ───────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-900">
              <Icon name="trophy" className="h-4 w-4 text-amber-500" />
              Fight card
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Built manually by the manager — main event, co-main, undercard. No auto-draw on professional events.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/app/events/${id}/draws`)}>
            <Icon name="settings" className="mr-1.5 h-3.5 w-3.5" />
            Open card builder
          </Button>
        </div>

        {orderedBouts.length === 0 ? (
          <div className="console-card">
            <Empty
              title="Fight card is empty"
              message="Pair your signed fighters yourself — set the main event, co-main, undercard, rounds and titles."
              action={
                canManage ? (
                  <Button onClick={() => navigate(`/app/events/${id}/draws`)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white">
                    <Icon name="trophy" className="h-4 w-4" />
                    Build the card
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <ol className="space-y-2.5">
            {orderedBouts.map((b, i) => {
              const a = b.boxerAId?.boxerId
              const bix = b.boxerBId?.boxerId
              const main = b.boutType === 'main_event' || i === 0
              const isTitle = b.titleFight || (main && titleFights > 0)
              return (
                <li
                  key={b._id}
                  className={cn(
                    'overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
                    main ? 'border-amber-300/80' : 'border-slate-200/80'
                  )}
                >
                  <div className={cn('flex flex-wrap items-center justify-between gap-2 px-4 py-2', main ? 'bg-gradient-to-r from-amber-50 to-rose-50/50' : 'bg-slate-50/60')}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-black text-white">{b.boutNumber || i + 1}</span>
                      <span className={cn('text-[10px] font-black uppercase tracking-[0.16em]', main ? 'text-amber-700' : 'text-slate-500')}>
                        {boutLabel(b)}
                      </span>
                      {isTitle && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-800 ring-1 ring-inset ring-amber-300">
                          Title — {b.titleName || 'Championship'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      {b.numberOfRounds && <span>{b.numberOfRounds} rounds</span>}
                      {b.minutesPerRound && <span>· {b.minutesPerRound} min</span>}
                      <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-inset ring-slate-200">{b.status || 'scheduled'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-slate-100 px-4 py-3">
                    {[a, bix].map((boxer, idx) => (
                      <div key={idx} className={cn('px-2', idx === 0 ? 'text-right' : 'text-left')}>
                        <p className="truncate text-sm font-black text-slate-900">
                          {boxer?.professional?.ringName || boxer?.fullName || 'TBA'}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                          {boxer
                            ? [boxer.professional?.record ? recordText(boxer) : '', boxer.professional?.division || ''].filter(Boolean).join(' · ')
                            : 'Awaiting opponent'}
                        </p>
                      </div>
                    ))}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* ── Fight night info ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <Icon name="shield" className="h-4 w-4 text-slate-400" />
            Fight night details
          </h2>
          {canManage && (
            <Button size="sm" variant="secondary" onClick={openEditEvent}>
              <Icon name="settings" className="mr-1.5 h-3.5 w-3.5" />
              Edit details
            </Button>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Date', eventData?.eventDate ? fmtDate(eventData.eventDate) : ''],
            ['Venue', eventData?.venue],
            ['Location', eventData?.location],
            ['Series', pro.seriesName],
            ['Event number', pro.eventNumber],
            ['Promotion', pro.promotionName],
            ['Sanctioning body', pro.sanctioningBody],
            ['Broadcast', pro.broadcast?.network],
            ['Stream / PPV', pro.broadcast?.payPerView ? 'Pay-per-view' : pro.broadcast?.streamUrl ? 'Streaming' : ''],
            ['Doors open', pro.doorsOpen],
            ['First bell', pro.firstBell],
            ['Weigh-in venue', pro.weighInVenue],
            ['Capacity', pro.capacity],
            ['Matchmaker', pro.matchmaker],
            ['Ring announcer', pro.ringAnnouncer],
            ['Tickets', pro.ticketing?.url],
          ]
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-800">{String(value)}</p>
              </div>
            ))}
          {!pro.seriesName && !pro.promotionName && !pro.sanctioningBody && !eventData?.venue && !eventData?.location && (
            <p className="text-xs text-slate-500">Use “Edit details” to add promotion, series, broadcast, venue and fight-night times.</p>
          )}
        </div>
      </section>

      {/* ── Edit fight night details ─────────────────────────────────── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit fight night"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEvent} disabled={eventSaving}>
              {eventSaving ? <Spinner className="h-4 w-4 border-white" /> : 'Save fight night'}
            </Button>
          </>
        }
      >
        {editForm && (
          <form onSubmit={saveEvent} className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Event basics</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Event name *" value={editForm.name} onChange={setEdit('name')} required />
                <Input label="Event date" type="date" value={editForm.eventDate} onChange={setEdit('eventDate')} />
                <Input label="Venue" value={editForm.venue} onChange={setEdit('venue')} placeholder="e.g. Kigali Arena" />
                <Input label="City / location" value={editForm.location} onChange={setEdit('location')} placeholder="City, Country" />
                <Input label="Sanctioning body" value={editForm.sanctioningBody} onChange={setEdit('sanctioningBody')} placeholder="e.g. National Boxing Commission" />
                <Input label="Capacity" type="number" value={editForm.capacity} onChange={setEdit('capacity')} placeholder="e.g. 5000" />
              </div>
              <div className="mt-3">
                <Textarea label="Description" value={editForm.description} onChange={setEdit('description')} rows={2} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Promotion & series</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Promotion name" value={editForm.promotionName} onChange={setEdit('promotionName')} placeholder="e.g. Bodymax Promotions" />
                <Input label="Series name" value={editForm.seriesName} onChange={setEdit('seriesName')} placeholder="e.g. Fight Night Series" />
                <Input label="Event number" type="number" value={editForm.eventNumber} onChange={setEdit('eventNumber')} placeholder="e.g. 4" />
                <Input label="Tagline" value={editForm.tagline} onChange={setEdit('tagline')} placeholder="e.g. No Mercy" />
                <Input label="Poster URL" value={editForm.posterUrl} onChange={setEdit('posterUrl')} placeholder="https://…/poster.jpg" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Broadcast & ticketing</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Broadcast network" value={editForm.broadcastNetwork} onChange={setEdit('broadcastNetwork')} placeholder="e.g. SuperSport" />
                <Input label="Stream URL" value={editForm.broadcastStreamUrl} onChange={setEdit('broadcastStreamUrl')} placeholder="https://…" />
                <Input label="Ticket URL" value={editForm.ticketingUrl} onChange={setEdit('ticketingUrl')} placeholder="https://tickets…" />
                <Input label="Currency" value={editForm.ticketingCurrency} onChange={setEdit('ticketingCurrency')} placeholder="USD" />
                <Input label="Price from" type="number" value={editForm.ticketingPriceFrom} onChange={setEdit('ticketingPriceFrom')} placeholder="e.g. 25" />
                <label className="flex items-end gap-2 pb-2 text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editForm.payPerView}
                    onChange={setEditChecked('payPerView')}
                    className="h-4 w-4 rounded"
                  />
                  Pay-per-view event
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Fight night logistics</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input label="Doors open" value={editForm.doorsOpen} onChange={setEdit('doorsOpen')} placeholder="e.g. 18:00" />
                <Input label="First bell" value={editForm.firstBell} onChange={setEdit('firstBell')} placeholder="e.g. 19:30" />
                <Input label="Weigh-in venue" value={editForm.weighInVenue} onChange={setEdit('weighInVenue')} placeholder="e.g. Arena Hall B" />
                <Input label="Rules meeting" type="date" value={editForm.rulesMeetingAt} onChange={setEdit('rulesMeetingAt')} />
                <Input label="Medical officer" value={editForm.medicalOfficer} onChange={setEdit('medicalOfficer')} placeholder="Dr. …" />
                <Input label="Matchmaker" value={editForm.matchmaker} onChange={setEdit('matchmaker')} placeholder="Matchmaker name" />
                <Input label="Ring announcer" value={editForm.ringAnnouncer} onChange={setEdit('ringAnnouncer')} placeholder="Announcer name" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Public page & rules</p>
              <label className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={editForm.public}
                  onChange={setEditChecked('public')}
                  className="h-4 w-4 rounded"
                />
                Show this fight night on the public site
              </label>
              <Textarea label="Event rules" value={editForm.rules} onChange={setEdit('rules')} rows={3} placeholder="Rules shown on the public fight-night page…" />
            </div>
          </form>
        )}
      </Modal>

      {/* ── Add / edit fighter ───────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.boxerId?.fullName || 'Fighter'}` : 'Add Professional Fighter'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Spinner className="h-4 w-4 border-white" /> : editing ? 'Save changes' : 'Add to fight night'}
            </Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-5">
          {/* Event billing */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-rose-500">This fight night</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select label="Corner" value={entryForm.corner} onChange={(e) => setEntryForm({ ...entryForm, corner: e.target.value })}>
                {CORNERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Select label="Billing" value={entryForm.billing} onChange={(e) => setEntryForm({ ...entryForm, billing: e.target.value })}>
                {BILLING.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </Select>
              <Select label="Status" value={entryForm.status} onChange={(e) => setEntryForm({ ...entryForm, status: e.target.value })}>
                {ENTRY_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Input label="Scheduled rounds" type="number" value={entryForm.scheduledRounds} onChange={(e) => setEntryForm({ ...entryForm, scheduledRounds: e.target.value })} placeholder="e.g. 10" />
              <Input label="Contracted weight (kg)" type="number" value={entryForm.contractedWeightKg} onChange={(e) => setEntryForm({ ...entryForm, contractedWeightKg: e.target.value })} placeholder="e.g. 72.5" />
              <Input label="Team passes" type="number" value={entryForm.teamPasses} onChange={(e) => setEntryForm({ ...entryForm, teamPasses: e.target.value })} placeholder="e.g. 6" />
              <Input label="Walkout music" value={entryForm.walkoutMusic} onChange={(e) => setEntryForm({ ...entryForm, walkoutMusic: e.target.value })} placeholder="Track name" />
              <Input label="Colors" value={entryForm.colors} onChange={(e) => setEntryForm({ ...entryForm, colors: e.target.value })} placeholder="e.g. Red & gold" />
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={entryForm.titleOnLine}
                onChange={(e) => setEntryForm({ ...entryForm, titleOnLine: e.target.checked })}
                className="h-4 w-4 rounded"
              />
              Fighting for a title on this card
            </label>
            {entryForm.titleOnLine && (
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <Input label="Title name" value={entryForm.titleName} onChange={(e) => setEntryForm({ ...entryForm, titleName: e.target.value })} placeholder="e.g. National Welterweight Title" />
                <Input label="Sanctioning body" value={entryForm.sanctioningBody} onChange={(e) => setEntryForm({ ...entryForm, sanctioningBody: e.target.value })} placeholder="e.g. National Commission" />
              </div>
            )}
          </div>

          <ProBoxerFields form={form} setForm={setForm} />
        </form>
      </Modal>

      {/* ── Attach existing pro boxer ────────────────────────────────── */}
      <Modal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="Attach an existing pro boxer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAttachOpen(false)}>Cancel</Button>
            <Button onClick={attachExisting} disabled={attaching || !attachId}>
              {attaching ? <Spinner className="h-4 w-4 border-white" /> : 'Attach to card'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Pull a fighter that already has a full profile in your professional roster onto this fight night.</p>
        <div className="mt-4">
          {globalBoxers === null ? (
            <Loading />
          ) : attachable.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
              Every professional boxer in your roster is already on this card. Create a new fighter instead.
            </p>
          ) : (
            <Select label="Professional boxer" value={attachId} onChange={(e) => setAttachId(e.target.value)}>
              <option value="">Select a boxer</option>
              {attachable.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.fullName}
                  {b.professional?.division ? ` — ${b.professional.division}` : ''}
                </option>
              ))}
            </Select>
          )}
        </div>
      </Modal>
    </div>
  )
}
