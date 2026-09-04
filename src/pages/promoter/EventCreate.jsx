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

export default function EventCreate() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [weightCategories, setWeightCategories] = useState([])
  const [ageCategories, setAgeCategories] = useState([])
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
    setSaving(true)
    try {
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
        weightCategories,
        ageCategories,
        requireWeighIn: form.requireWeighIn,
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Event</h1>
        <p className="text-sm text-slate-500">Set up your boxing tournament details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <TagInput label="Weight Categories" placeholder="e.g. 60kg" values={weightCategories} setValues={setWeightCategories} />
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

        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => navigate('/app/events')}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 border-white" /> : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  )
}
