import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Input, Textarea } from '../../components/Field.jsx'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Spinner } from '../../components/Loading.jsx'
import TagInput from '../../components/TagInput.jsx'
import WeightClassEditor from '../../components/WeightClassEditor.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { Icon } from '../../components/Icons.jsx'
import { normalizeWeightClasses, validateWeightClasses, weightCategoryLabels } from '../../utils/weightClasses.js'

export default function EventCreate() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [eventType, setEventType] = useState('amateur')
  const [weightClasses, setWeightClasses] = useState([])
  const [ageCategories, setAgeCategories] = useState([])
  const [pro, setPro] = useState({
    seriesName: '',
    eventNumber: '',
    tagline: '',
    posterUrl: '',
    promotionName: '',
    coPromoters: [],
    sanctioningBody: '',
    broadcast: { network: '', streamUrl: '', payPerView: false },
    ticketing: { url: '', currency: 'USD', priceFrom: '' },
    doorsOpen: '',
    firstBell: '',
    weighInVenue: '',
    rulesMeetingAt: '',
    medicalOfficer: '',
    matchmaker: '',
    ringAnnouncer: '',
    capacity: '',
  })
  const [form, setForm] = useState({
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

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const weightError = validateWeightClasses(weightClasses)
    if (weightError) {
      setError(weightError)
      return
    }
    setSaving(true)
    try {
      const normalizedWeightClasses = normalizeWeightClasses(weightClasses)
      const proPayload = eventType === 'professional'
        ? {
            seriesName: pro.seriesName,
            eventNumber: Number(pro.eventNumber) || null,
            tagline: pro.tagline,
            posterUrl: pro.posterUrl,
            promotionName: pro.promotionName,
            coPromoters: pro.coPromoters || [],
            sanctioningBody: pro.sanctioningBody,
            broadcast: {
              network: pro.broadcast.network,
              streamUrl: pro.broadcast.streamUrl,
              payPerView: Boolean(pro.broadcast.payPerView),
            },
            ticketing: {
              url: pro.ticketing.url,
              currency: pro.ticketing.currency,
              priceFrom: Number(pro.ticketing.priceFrom) || null,
            },
            doorsOpen: pro.doorsOpen,
            firstBell: pro.firstBell,
            weighInVenue: pro.weighInVenue,
            rulesMeetingAt: pro.rulesMeetingAt ? new Date(pro.rulesMeetingAt) : null,
            medicalOfficer: pro.medicalOfficer,
            matchmaker: pro.matchmaker,
            ringAnnouncer: pro.ringAnnouncer,
            capacity: Number(pro.capacity) || null,
          }
        : undefined
      const payload = {
        name: form.name,
        description: form.description,
        venue: form.venue,
        location: form.location,
        eventDate: form.eventDate ? new Date(form.eventDate) : null,
        registrationOpens: form.registrationOpens ? new Date(form.registrationOpens) : null,
        registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline) : null,
        weighInDate: form.weighInDate ? new Date(form.weighInDate) : null,
        rules: form.rules,
        registrationRequirements: form.registrationRequirements,
        weightClasses: normalizedWeightClasses,
        weightCategories: weightCategoryLabels(normalizedWeightClasses),
        ageCategories: eventType === 'professional' ? [] : ageCategories,
        ...(eventType === 'professional' ? { pro: proPayload } : {}),
        requireWeighIn: eventType === 'professional' ? true : form.requireWeighIn,
        public: form.public,
        createdBy: user.id,
      }
      const res = await api('/events/create', { method: 'POST', body: payload })
      toast('Event created successfully')
      navigate(`/app/events/${res.event._id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Events"
        title="Create New Event"
        description="Set up the tournament, registration window and competition categories."
        actions={
          <Button type="button" variant="secondary" onClick={() => navigate('/app/events')}>
            Back to events
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              {[
                { id: 'amateur', label: 'Amateur Tournament' },
                { id: 'professional', label: 'Professional Fight Night' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEventType(t.id)}
                  className={`rounded-xl px-4 py-2.5 text-center text-xs font-bold transition ${eventType === t.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {eventType === 'professional'
                ? 'Professional fight nights are promoter-managed: boxers are added to the card directly and there is no public registration link.'
                : 'Amateur events run the club registration flow with a public registration link.'}
            </p>
          </CardBody>
        </Card>

        {eventType === 'professional' && (
          <Card>
            <CardHeader title="Professional Fight Night" subtitle="Promotion, sanctioning and logistics" />
            <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Series name" value={pro.seriesName} onChange={(e) => setPro({ ...pro, seriesName: e.target.value })} placeholder="e.g. Bodymax Fight Night" />
              <Input label="Event number" type="number" value={pro.eventNumber} onChange={(e) => setPro({ ...pro, eventNumber: e.target.value })} placeholder="e.g. 12" />
              <Input label="Tagline" value={pro.tagline} onChange={(e) => setPro({ ...pro, tagline: e.target.value })} placeholder="e.g. The Takeover" />
              <Input label="Poster URL" value={pro.posterUrl} onChange={(e) => setPro({ ...pro, posterUrl: e.target.value })} placeholder="https://…/poster.jpg" />
              <Input label="Promotion name" value={pro.promotionName} onChange={(e) => setPro({ ...pro, promotionName: e.target.value })} placeholder="e.g. Bodymax Promotions" />
              <TagInput label="Co-promoters" placeholder="Add a promoter" values={pro.coPromoters} setValues={(v) => setPro({ ...pro, coPromoters: v })} />
              <Input label="Sanctioning body / commission" value={pro.sanctioningBody} onChange={(e) => setPro({ ...pro, sanctioningBody: e.target.value })} placeholder="e.g. Rwanda Boxing Commission" />
              <Input label="Broadcast network" value={pro.broadcast.network} onChange={(e) => setPro({ ...pro, broadcast: { ...pro.broadcast, network: e.target.value } })} placeholder="e.g. TVR" />
              <Input label="Broadcast stream URL" value={pro.broadcast.streamUrl} onChange={(e) => setPro({ ...pro, broadcast: { ...pro.broadcast, streamUrl: e.target.value } })} placeholder="https://…" />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(pro.broadcast.payPerView)} onChange={(e) => setPro({ ...pro, broadcast: { ...pro.broadcast, payPerView: e.target.checked } })} className="h-4 w-4 rounded" />
                Pay-per-view event
              </label>
              <Input label="Ticketing URL" value={pro.ticketing.url} onChange={(e) => setPro({ ...pro, ticketing: { ...pro.ticketing, url: e.target.value } })} placeholder="https://…" />
              <Input label="Price from (USD)" type="number" value={pro.ticketing.priceFrom} onChange={(e) => setPro({ ...pro, ticketing: { ...pro.ticketing, priceFrom: e.target.value } })} placeholder="e.g. 25" />
              <Input label="Doors open" value={pro.doorsOpen} onChange={(e) => setPro({ ...pro, doorsOpen: e.target.value })} placeholder="e.g. 18:00" />
              <Input label="First bell" value={pro.firstBell} onChange={(e) => setPro({ ...pro, firstBell: e.target.value })} placeholder="e.g. 19:00" />
              <Input label="Weigh-in venue" value={pro.weighInVenue} onChange={(e) => setPro({ ...pro, weighInVenue: e.target.value })} placeholder="Venue / hotel" />
              <Input label="Rules meeting at" type="date" value={pro.rulesMeetingAt} onChange={(e) => setPro({ ...pro, rulesMeetingAt: e.target.value })} />
              <Input label="Medical officer" value={pro.medicalOfficer} onChange={(e) => setPro({ ...pro, medicalOfficer: e.target.value })} placeholder="Name" />
              <Input label="Matchmaker" value={pro.matchmaker} onChange={(e) => setPro({ ...pro, matchmaker: e.target.value })} placeholder="Name" />
              <Input label="Ring announcer" value={pro.ringAnnouncer} onChange={(e) => setPro({ ...pro, ringAnnouncer: e.target.value })} placeholder="Name" />
              <Input label="Venue capacity" type="number" value={pro.capacity} onChange={(e) => setPro({ ...pro, capacity: e.target.value })} placeholder="e.g. 5000" />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Basic Information" />
          <CardBody className="space-y-4">
            <Input label="Event Name" value={form.name} onChange={set('name')} required placeholder="e.g. Midlands Championship 2026" />
            <Textarea label="Description" value={form.description} onChange={set('description')} rows={3} placeholder="What is this event about?" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Venue" value={form.venue} onChange={set('venue')} placeholder="Venue name" />
              <Input label="Location" value={form.location} onChange={set('location')} placeholder="City, Country" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Dates" />
          <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Event Date" type="date" value={form.eventDate} onChange={set('eventDate')} />
            <Input label="Registration Opens" type="date" value={form.registrationOpens} onChange={set('registrationOpens')} />
            <Input label="Registration Deadline" type="date" value={form.registrationDeadline} onChange={set('registrationDeadline')} />
            <Input label="Weigh-In Date" type="date" value={form.weighInDate} onChange={set('weighInDate')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Categories" />
          <CardBody className="space-y-4">
            <WeightClassEditor value={weightClasses} onChange={setWeightClasses} />
            <TagInput label="Age Categories" placeholder="e.g. Junior" values={ageCategories} setValues={setAgeCategories} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Rules & Requirements" />
          <CardBody className="space-y-4">
            <Textarea label="Competition Rules" value={form.rules} onChange={set('rules')} rows={3} />
            <Textarea label="Registration Requirements" value={form.registrationRequirements} onChange={set('registrationRequirements')} rows={3} placeholder="Documents and eligibility requirements" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Settings" />
          <CardBody className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.requireWeighIn} onChange={(e) => setForm({ ...form, requireWeighIn: e.target.checked })} className="h-4 w-4 rounded" />
              <span className="text-sm text-slate-700">Require weigh-in before competition</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.public} onChange={(e) => setForm({ ...form, public: e.target.checked })} className="h-4 w-4 rounded" />
              <span className="text-sm text-slate-700">Make event visible to the public</span>
            </label>
          </CardBody>
        </Card>

        {error && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-900">{error}</p>}

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Button type="button" variant="ghost" onClick={() => navigate('/app/events')}>Cancel</Button>
          <Button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600">
            {saving ? <Spinner className="h-4 w-4 border-white" /> : <Icon name="plus" className="h-4 w-4" />}
            Create Event
          </Button>
        </div>
      </form>
    </div>
  )
}
