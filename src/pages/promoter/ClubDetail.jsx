import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Button } from '../../components/Button.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input } from '../../components/Field.jsx'
import { useToast } from '../../context/ToastContext.jsx'

export default function ClubDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [club, setClub] = useState(null)
  const [boxers, setBoxers] = useState(null)
  const [registrations, setRegistrations] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({ name: '', contactName: '', contactEmail: '', contactPhone: '', address: '' })
  const [busy, setBusy] = useState(false)

  const load = () => {
    api(`/clubs?clubId=${id}&populate=true`).then((d) => { setClub(d.club); setBoxers(d.boxers) }).catch(() => {})
    api(`/registrations?clubId=${id}`).then((d) => setRegistrations(d.registrations)).catch(() => {})
  }

  useEffect(load, [id])

  const openEdit = () => {
    setForm({
      name: club.name || '',
      contactName: club.contactName || '',
      contactEmail: club.contactEmail || '',
      contactPhone: club.contactPhone || '',
      address: club.address || '',
    })
    setEditOpen(true)
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const saveEdit = async () => {
    setBusy(true)
    try {
      await api(`/clubs?clubId=${id}`, { method: 'PUT', body: form })
      toast('Club updated')
      setEditOpen(false)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete club "${club.name}" and its login account? This cannot be undone.`)) return
    setBusy(true)
    try {
      await api(`/clubs?clubId=${id}`, { method: 'DELETE' })
      toast('Club deleted')
      navigate('/app/clubs')
    } catch (err) {
      toast(err.message, 'error')
      setBusy(false)
    }
  }

  if (!club || !boxers || !registrations) return <Loading />

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/app/clubs')} className="mb-1 text-sm text-brand-600 hover:underline">← Clubs</button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{club.name}</h1>
            <p className="text-sm text-slate-500">{club.contactName || 'Club'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={openEdit}>Edit</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Club</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Boxers" subtitle={`${boxers.length} boxers in this club`} />
          <CardBody className="p-0">
            {boxers.length === 0 ? (
              <Empty title="No boxers" message="This club has not added any boxers yet." />
            ) : (
              <ul className="divide-y divide-slate-200">
                {boxers.map((b) => (
                  <li key={b._id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{b.fullName}</p>
                      <p className="text-sm text-slate-500">
                        {b.weightCategory && `${b.weightCategory} · `}
                        {b.ageCategory || '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Registrations" subtitle={`${registrations.length} event registrations`} />
          <CardBody className="p-0">
            {registrations.length === 0 ? (
              <Empty title="No registrations" />
            ) : (
              <ul className="divide-y divide-slate-200">
                {registrations.map((r) => (
                  <li key={r._id} className="px-5 py-3">
                    <p className="font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                    <p className="text-sm text-slate-500">Event: {r.eventId?.name || '—'}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Club"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy}>{busy ? <Spinner className="h-4 w-4 border-white" /> : 'Save'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Club Name" value={form.name} onChange={set('name')} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Contact Person" value={form.contactName} onChange={set('contactName')} />
            <Input label="Contact Phone" value={form.contactPhone} onChange={set('contactPhone')} />
          </div>
          <Input label="Contact Email" type="email" value={form.contactEmail} onChange={set('contactEmail')} />
          <Input label="Address" value={form.address} onChange={set('address')} />
        </div>
      </Modal>
    </div>
  )
}
