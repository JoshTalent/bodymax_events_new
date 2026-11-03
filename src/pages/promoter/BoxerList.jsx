import { useEffect, useMemo, useState } from 'react'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input, Select, Textarea } from '../../components/Field.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { Icon } from '../../components/Icons.jsx'
import { cn } from '../../utils/cn.js'

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

function initials(name = '') {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function ageFrom(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

export default function BoxerList() {
  const { toast } = useToast()
  const [boxers, setBoxers] = useState(null)
  const [clubs, setClubs] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    api('/boxers').then((d) => setBoxers(d.boxers)).catch(() => {})
  }
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

  const clubName = (id) => clubs.find((c) => c._id === id)?.name || 'Unattached'

  const filtered = useMemo(() => {
    const list = boxers || []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (b) =>
        (b.fullName || '').toLowerCase().includes(q) ||
        clubName(b.clubId).toLowerCase().includes(q) ||
        (b.weightCategory || '').toLowerCase().includes(q)
    )
  }, [boxers, search, clubs])

  const stats = useMemo(() => {
    const list = boxers || []
    return {
      total: list.length,
      male: list.filter((b) => b.gender === 'M').length,
      female: list.filter((b) => b.gender === 'F').length,
      clubs: new Set(list.map((b) => b.clubId).filter(Boolean)).size,
    }
  }, [boxers])

  return (
    <div>
      <PageHeader
        eyebrow="Network"
        title="Boxers"
        description="Every registered boxer across your club network, with records, categories and contact details."
        actions={
          <Button onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 text-xs font-bold shadow-lg shadow-brand-600/25 hover:from-brand-700 hover:to-indigo-700">
            <Icon name="plus" className="h-4 w-4" />
            Add Boxer
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Total boxers', value: stats.total, icon: 'boxers', tone: 'bg-brand-50 text-brand-600' },
          { label: 'Male', value: stats.male, icon: 'users', tone: 'bg-blue-50 text-blue-600' },
          { label: 'Female', value: stats.female, icon: 'users', tone: 'bg-pink-50 text-pink-600' },
          { label: 'Clubs represented', value: stats.clubs, icon: 'clubs', tone: 'bg-teal-50 text-teal-600' },
        ].map((s, i) => (
          <div key={s.label} className={cn('console-card animate-rise flex items-center gap-3 p-4', `delay-${i + 1}`)}>
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', s.tone)}>
              <Icon name={s.icon} className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-xl font-black leading-tight text-slate-900">{boxers ? s.value : '—'}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="animate-rise delay-2 console-card mb-5 flex items-center justify-between gap-3 p-3">
        <p className="pl-2 text-[11px] font-semibold text-slate-500">
          Showing <span className="font-bold text-slate-800">{filtered.length}</span> of {boxers?.length ?? 0} boxers
        </p>
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 sm:max-w-xs">
          <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search boxer, club or weight..."
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {!boxers ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="console-card">
          <Empty
            title={boxers.length === 0 ? 'No boxers yet' : 'No matching boxers'}
            message={boxers.length === 0 ? 'Boxers will appear here as clubs add them.' : 'Try a different search term.'}
          />
        </div>
      ) : (
        <div className="console-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-bold">Boxer</th>
                  <th className="px-5 py-3 font-bold">Club</th>
                  <th className="px-5 py-3 font-bold">Category</th>
                  <th className="px-5 py-3 font-bold">Record</th>
                  <th className="px-5 py-3 font-bold">Profile</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((b) => {
                  const age = ageFrom(b.dateOfBirth)
                  return (
                    <tr key={b._id} className="group transition hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-950 text-[10px] font-bold text-white">
                            {initials(b.fullName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">{b.fullName}</p>
                            <p className="text-[11px] text-slate-500">
                              {b.gender === 'M' ? 'Male' : b.gender === 'F' ? 'Female' : 'Gender N/A'}
                              {age != null && ` · ${age} yrs`}
                              {b.nationality && ` · ${b.nationality}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Icon name="clubs" className="h-3.5 w-3.5 text-slate-400" />
                          {clubName(b.clubId)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {b.weightCategory && <Badge tone="blue">{b.weightCategory}</Badge>}
                          {b.ageCategory && <Badge tone="slate">{b.ageCategory}</Badge>}
                          {!b.weightCategory && !b.ageCategory && <span className="text-xs text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700">
                          <span className="text-emerald-600">{b.boxingRecord?.wins || 0}W</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-500">{b.boxingRecord?.losses || 0}L</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-500">{b.boxingRecord?.draws || 0}D</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-slate-500">
                        {b.registeredWeightKg ? `${b.registeredWeightKg} kg` : b.experience || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(b)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(b)}
                            className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
