import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardBody } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input, Select, Textarea } from '../../components/Field.jsx'

const emptyForm = {
  clubId: '',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  identificationNumber: '',
  registeredWeightKg: '',
  weightCategory: '',
  ageCategory: '',
  experience: '',
  boxingRecord: { wins: '', losses: '', draws: '' },
  notes: '',
}

export default function BoxerList() {
  const { toast } = useToast()
  const [boxers, setBoxers] = useState(null)
  const [clubs, setClubs] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => { api('/boxers').then((d) => setBoxers(d.boxers)).catch(() => {}) }
  useEffect(load, [])
  useEffect(() => {
    api('/clubs').then((d) => setClubs(d.clubs || [])).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, clubId: clubs[0]?._id || '' })
    setModalOpen(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    setForm({
      clubId: b.clubId || '',
      fullName: b.fullName || '',
      dateOfBirth: b.dateOfBirth ? b.dateOfBirth.slice(0, 10) : '',
      gender: b.gender || '',
      nationality: b.nationality || '',
      identificationNumber: b.identificationNumber || '',
      registeredWeightKg: b.registeredWeightKg ?? '',
      weightCategory: b.weightCategory || '',
      ageCategory: b.ageCategory || '',
      experience: b.experience || '',
      boxingRecord: {
        wins: b.boxingRecord?.wins ?? '',
        losses: b.boxingRecord?.losses ?? '',
        draws: b.boxingRecord?.draws ?? '',
      },
      notes: b.notes || '',
    })
    setModalOpen(true)
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.clubId) {
      toast('Select a club', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : null,
        gender: form.gender || null,
        nationality: form.nationality,
        identificationNumber: form.identificationNumber,
        registeredWeightKg: form.registeredWeightKg ? Number(form.registeredWeightKg) : null,
        weightCategory: form.weightCategory,
        ageCategory: form.ageCategory,
        experience: form.experience,
        boxingRecord: {
          wins: Number(form.boxingRecord.wins) || 0,
          losses: Number(form.boxingRecord.losses) || 0,
          draws: Number(form.boxingRecord.draws) || 0,
        },
        notes: form.notes,
      }
      if (editing) {
        await api(`/boxers?id=${editing._id}`, { method: 'PUT', body: { ...payload, clubId: form.clubId } })
        toast('Boxer updated')
      } else {
        await api('/boxers', { method: 'POST', body: { ...payload, clubId: form.clubId } })
        toast('Boxer added')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete ${b.fullName}?`)) return
    try {
      await api(`/boxers?id=${b._id}`, { method: 'DELETE' })
      toast('Boxer deleted')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const clubName = (id) => clubs.find((c) => c._id === id)?.name || ''

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Boxers</h1>
          <p className="text-sm text-slate-500">All boxers across participating clubs</p>
        </div>
        <Button onClick={openCreate}>+ Add Boxer</Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {!boxers ? (
            <Loading />
          ) : boxers.length === 0 ? (
            <Empty title="No boxers yet" message="Boxers will appear here as clubs add them." />
          ) : (
            <ul className="divide-y divide-slate-200">
              {boxers.map((b) => (
                <li key={b._id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{b.fullName}</p>
                    <p className="text-sm text-slate-500">
                      {clubName(b.clubId)}
                      {b.gender === 'M' ? ' · Male' : b.gender === 'F' ? ' · Female' : ' · Gender N/A'}
                      {b.dateOfBirth && ` · ${new Date(b.dateOfBirth).toLocaleDateString()}`}
                    </p>
                    <div className="mt-1 flex gap-2">
                      {b.weightCategory && <Badge>{b.weightCategory}</Badge>}
                      {b.ageCategory && <Badge>{b.ageCategory}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(b)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(b)}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Boxer' : 'Add Boxer'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Spinner className="h-4 w-4 border-white" /> : 'Save'}</Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Select label="Club" value={form.clubId} onChange={set('clubId')}>
            <option value="">Select club</option>
            {clubs.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>
          <Input label="Full Name" value={form.fullName} onChange={set('fullName')} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            <Select label="Gender" value={form.gender} onChange={set('gender')}>
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nationality" value={form.nationality} onChange={set('nationality')} />
            <Input label="Identification No." value={form.identificationNumber} onChange={set('identificationNumber')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Registered Weight (kg)" type="number" value={form.registeredWeightKg} onChange={set('registeredWeightKg')} />
            <Input label="Weight Category" value={form.weightCategory} onChange={set('weightCategory')} placeholder="e.g. 60kg" />
            <Input label="Age Category" value={form.ageCategory} onChange={set('ageCategory')} placeholder="e.g. Junior" />
          </div>
          <Input label="Experience" value={form.experience} onChange={set('experience')} placeholder="e.g. Amateur, 3 years" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Wins" type="number" value={form.boxingRecord.wins} onChange={(e) => setForm({ ...form, boxingRecord: { ...form.boxingRecord, wins: e.target.value } })} />
            <Input label="Losses" type="number" value={form.boxingRecord.losses} onChange={(e) => setForm({ ...form, boxingRecord: { ...form.boxingRecord, losses: e.target.value } })} />
            <Input label="Draws" type="number" value={form.boxingRecord.draws} onChange={(e) => setForm({ ...form, boxingRecord: { ...form.boxingRecord, draws: e.target.value } })} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={2} />
        </form>
      </Modal>
    </div>
  )
}