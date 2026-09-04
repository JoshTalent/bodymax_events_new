import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Input } from '../../components/Field.jsx'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Spinner } from '../../components/Loading.jsx'

export default function ClubCreate() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    clubName: '',
    name: '',
    email: '',
    password: '',
    contactName: '',
    contactPhone: '',
    address: '',
  })

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api('/users/create', {
        method: 'POST',
        body: { action: 'create_club_account', ...form },
      })
      toast('Club and account created')
      navigate('/app/clubs')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add a Club</h1>
        <p className="text-sm text-slate-500">Create the club and its login credentials</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader title="Club Details" />
          <CardBody className="space-y-4">
            <Input label="Club Name" value={form.clubName} onChange={set('clubName')} required placeholder="e.g. Iron Fist Boxing Club" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Contact Person" value={form.contactName} onChange={set('contactName')} />
              <Input label="Contact Phone" value={form.contactPhone} onChange={set('contactPhone')} />
            </div>
            <Input label="Address" value={form.address} onChange={set('address')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Login Credentials" subtitle="The club will use these to access the portal" />
          <CardBody className="space-y-4">
            <Input label="Account Holder Name" value={form.name} onChange={set('name')} required placeholder="Person who manages the club account" />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} required placeholder="club@example.com" />
            <Input label="Password" type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="Minimum 6 characters" />
          </CardBody>
        </Card>

        {error && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-900">{error}</p>}

        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => navigate('/app/clubs')}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 border-white" /> : 'Create Club'}
          </Button>
        </div>
      </form>
    </div>
  )
}
