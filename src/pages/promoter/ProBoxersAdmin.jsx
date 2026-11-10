import { useEffect, useMemo, useState } from 'react'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Select } from '../../components/Field.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { Icon } from '../../components/Icons.jsx'
import { cn } from '../../utils/cn.js'
import {
  STANCES,
  emptyProBoxerForm,
  proBoxerFormFrom,
  proBoxerPayload,
  ProBoxerFields,
} from '../../components/ProBoxerForm.jsx'

function initials(name = '') {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function flagOf(code = '') {
  const c = String(code || '').toUpperCase()
  if (c.length < 2) return ''
  return String.fromCodePoint(127397 + c.charCodeAt(0)) + String.fromCodePoint(127397 + c.charCodeAt(1))
}

export default function ProBoxersAdmin() {
  const { toast } = useToast()
  const [boxers, setBoxers] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...emptyProBoxerForm })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDivision, setFilterDivision] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterStance, setFilterStance] = useState('all')

  const load = async () => {
    try {
      const d = await api('/boxers?boxerType=professional')
      setBoxers(d.boxers || [])
    } catch (err) {
      toast(err.message, 'error')
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyProBoxerForm })
    setModalOpen(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    setForm(proBoxerFormFrom(b))
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) {
      toast('Enter the boxer name', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = proBoxerPayload(form, editing?.professional?.titles || [])
      if (editing) {
        await api(`/boxers?id=${editing._id}`, { method: 'PUT', body: payload })
        toast('Professional boxer updated')
      } else {
        await api('/boxers', { method: 'POST', body: payload })
        toast('Professional boxer added')
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
    if (!window.confirm(`Remove ${b.fullName} from professional boxers? This will also delete their event entries and bouts.`)) return
    try {
      await api(`/boxers?id=${b._id}`, { method: 'DELETE' })
      toast('Boxer removed')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const countries = useMemo(() => {
    const set = new Set()
    ;(boxers || []).forEach((b) => {
      const c = b.professional?.country || b.nationality
      if (c) set.add(c)
    })
    return [...set].sort()
  }, [boxers])

  const divisions = useMemo(() => {
    const set = new Set()
    ;(boxers || []).forEach((b) => {
      const d = b.professional?.division
      if (d) set.add(d)
    })
    return [...set].sort()
  }, [boxers])

  const filtered = useMemo(() => {
    const list = boxers || []
    const q = search.trim().toLowerCase()
    return list.filter((b) => {
      const pro = b.professional || {}
      const name = `${b.fullName} ${pro.ringName || ''} ${pro.nickname || ''}`.toLowerCase()
      if (q && !name.includes(q) && !(b.nationality || '').toLowerCase().includes(q) && !(pro.country || '').toLowerCase().includes(q)) return false
      if (filterDivision !== 'all' && pro.division !== filterDivision) return false
      if (filterCountry !== 'all' && (pro.country || b.nationality) !== filterCountry) return false
      if (filterStance !== 'all' && pro.stance !== filterStance) return false
      return true
    })
  }, [boxers, search, filterDivision, filterCountry, filterStance])

  const stats = useMemo(() => {
    const list = boxers || []
    const pros = list.filter((b) => b.professional)
    const totalKOs = pros.reduce((s, b) => s + (b.professional?.record?.koWins || 0), 0)
    const totalWins = pros.reduce((s, b) => s + (b.professional?.record?.wins || 0), 0)
    const currentTitles = pros.reduce((s, b) => s + (b.professional?.titles || []).filter((t) => t.current).length, 0)
    return { total: pros.length, wins: totalWins, kos: totalKOs, titles: currentTitles }
  }, [boxers])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Professional Roster"
        title="Pro Boxers"
        description="All professional boxers in the system, with photos, career records, titles, rankings and team details."
        actions={
          <Button onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-4 text-xs font-bold shadow-lg shadow-rose-600/25 hover:from-rose-700 hover:to-amber-700">
            <Icon name="plus" className="h-4 w-4" />
            Add Pro Boxer
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pro Boxers', value: stats.total, icon: 'users', tone: 'bg-rose-50 text-rose-600' },
          { label: 'Career Wins', value: stats.wins, icon: 'trophy', tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'KOs', value: stats.kos, icon: 'zap', tone: 'bg-amber-50 text-amber-600' },
          { label: 'Current Titles', value: stats.titles, icon: 'medal', tone: 'bg-amber-900 text-amber-200' },
        ].map((s) => (
          <div key={s.label} className="console-card flex items-center gap-3 p-4">
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

      <div className="console-card flex flex-wrap items-center justify-between gap-3 p-3">
        <p className="pl-2 text-[11px] font-semibold text-slate-500">
          Showing <span className="font-bold text-slate-800">{filtered.length}</span> of {boxers?.length ?? 0} professional boxers
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            label="Division"
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-500/10 min-w-[150px]"
          >
            <option value="all">All divisions</option>
            {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select
            label="Country"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-500/10 min-w-[150px]"
          >
            <option value="all">All countries</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select
            label="Stance"
            value={filterStance}
            onChange={(e) => setFilterStance(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-500/10 min-w-[140px]"
          >
            <option value="all">All stances</option>
            {STANCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10 sm:max-w-xs">
            <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boxer, ring name, country…"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {!boxers ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="console-card">
          <Empty
            title={boxers.length === 0 ? 'No professional boxers yet' : 'No matching boxers'}
            message={boxers.length === 0 ? 'Add your first professional boxer to get started.' : 'Try a different filter or search term.'}
            action={
              boxers.length === 0 ? (
                <Button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white">
                  <Icon name="plus" className="h-4 w-4" />
                  Add pro boxer
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="console-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-bold">Boxer</th>
                  <th className="px-5 py-3 font-bold">Division</th>
                  <th className="px-5 py-3 font-bold">Country</th>
                  <th className="px-5 py-3 font-bold">Record</th>
                  <th className="px-5 py-3 font-bold">Stance / H×R</th>
                  <th className="px-5 py-3 font-bold">Titles</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((b) => {
                  const pro = b.professional || {}
                  const rec = pro.record || {}
                  const titles = pro.titles?.filter((t) => t.current) || []
                  const titleText = titles.map((t) => t.title).join(', ') || '—'
                  const titleOrg = titles.map((t) => t.organisation).filter(Boolean).join(', ') || ''
                  const height = pro.heightCm ? `${pro.heightCm}cm` : '—'
                  const reach = pro.reachCm ? `${pro.reachCm}cm` : '—'
                  return (
                    <tr key={b._id} className="group transition hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {pro.photos?.headshotUrl || b.photoUrl ? (
                            <img src={pro.photos?.headshotUrl || b.photoUrl} alt={b.fullName} className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-amber-600 text-[10px] font-bold text-white shadow-sm">
                              {initials(b.fullName)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">{b.fullName}</p>
                            {pro.ringName && <p className="mt-0.5 text-[11px] italic text-rose-600 font-semibold">{pro.ringName}{pro.nickname ? ` "${pro.nickname}"` : ''}</p>}
                            <p className="text-[11px] text-slate-500 truncate">
                              {[pro.country || b.nationality || '—', flagOf(pro.countryCode)].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone="blue" className="text-[11px]">{pro.division || '—'}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">{pro.country || b.nationality || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700">
                          <span className="text-emerald-600">{rec.wins || 0}W</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-500">{rec.losses || 0}L</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-500">{rec.draws || 0}D</span>
                          {(rec.koWins || 0) > 0 && <span className="ml-1 text-[10px] font-bold text-amber-600">{rec.koWins}KO</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] text-slate-600">{pro.stance || '—'} · {height} / {reach}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] text-slate-600 truncate">{titleText}</span>
                        {titleOrg && <span className="block text-[10px] text-slate-400 truncate">{titleOrg}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(b)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          >
                            Edit
                          </button>
                          <a
                            href={`/boxer/${b._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                          >
                            View
                          </a>
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
        title={editing ? 'Edit Professional Boxer' : 'Add Professional Boxer'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Spinner className="h-4 w-4 border-white" /> : 'Save Boxer'}</Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <ProBoxerFields form={form} setForm={setForm} />
        </form>
      </Modal>
    </div>
  )
}
