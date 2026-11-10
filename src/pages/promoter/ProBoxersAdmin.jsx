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

const DIVISIONS = [
  'Heavyweight', 'Cruiserweight', 'Light Heavyweight', 'Super Middleweight', 'Middleweight',
  'Super Welterweight', 'Welterweight', 'Super Lightweight', 'Lightweight', 'Super Featherweight',
  'Featherweight', 'Super Bantamweight', 'Bantamweight', 'Super Flyweight', 'Flyweight',
  'Light Flyweight', 'Strawweight', 'Minimumweight',
]
const STANCES = ['Orthodox', 'Southpaw', 'Switch']
const COUNTRIES = []

const emptyForm = {
  fullName: '',
  ringName: '',
  nickname: '',
  gender: 'M',
  country: '',
  countryCode: '',
  nationality: '',
  residence: '',
  dateOfBirth: '',
  heightCm: '',
  reachCm: '',
  stance: '',
  division: '',
  careerHighWeightKg: '',
  weightCategory: '',
  ageCategory: '',
  headshotUrl: '',
  fullBodyUrl: '',
  countryFlagUrl: '',
  wins: '',
  losses: '',
  draws: '',
  noContests: '',
  koWins: '',
  roundsBoxed: '',
  debutDate: '',
  wbc: '',
  wba: '',
  ibf: '',
  wbo: '',
  other: '',
  promoterCompany: '',
  managerName: '',
  trainerName: '',
  cutmanName: '',
  agentName: '',
  licenseNumber: '',
  licenseCommission: '',
  licenseExpiry: '',
  medicalSuspension: '',
  medicalNotes: '',
  insuranceProvider: '',
  insurancePolicy: '',
  insuranceExpiry: '',
  instagram: '',
  x: '',
  facebook: '',
  youtube: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  amateurRecord: '',
  amateurAchievements: '',
  olympics: '',
  notes: '',
  titlesText: '',
  slug: '',
  medLastExamDate: '',
  medExpiryDate: '',
  medBloodworkDate: '',
  medMriDate: '',
  medEyeTestDate: '',
  medHepatitisB: false,
  medHepatitisC: false,
  medHiv: false,
  medSuspension: '',
  medNotes: '',
  medStatus: 'cleared',
}

const emptyTitles = []

function initials(name = '') {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export default function ProBoxersAdmin() {
  const { toast } = useToast()
  const [boxers, setBoxers] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDivision, setFilterDivision] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterStance, setFilterStance] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const d = await api('/boxers?boxerType=professional')
      setBoxers(d.boxers || [])
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setModalOpen(true)
  }

  const openEdit = (b) => {
    const pro = b.professional || {}
    const rec = pro.record || {}
    setEditing(b)
    setForm({
      fullName: b.fullName || '',
      ringName: pro.ringName || '',
      nickname: pro.nickname || '',
      gender: b.gender || 'M',
      country: pro.country || '',
      countryCode: pro.countryCode || '',
      nationality: pro.nationality || b.nationality || '',
      residence: pro.residence || '',
      dateOfBirth: b.dateOfBirth ? b.dateOfBirth.slice(0, 10) : '',
      heightCm: pro.heightCm ?? '',
      reachCm: pro.reachCm ?? '',
      stance: pro.stance || '',
      division: pro.division || '',
      careerHighWeightKg: pro.careerHighWeightKg ?? '',
      weightCategory: b.weightCategory || '',
      ageCategory: b.ageCategory || '',
      headshotUrl: pro.photos?.headshotUrl || b.photoUrl || '',
      fullBodyUrl: pro.photos?.fullBodyUrl || '',
      countryFlagUrl: pro.photos?.countryFlagUrl || '',
      wins: rec.wins ?? '',
      losses: rec.losses ?? '',
      draws: rec.draws ?? '',
      noContests: rec.noContests ?? '',
      koWins: rec.koWins ?? '',
      roundsBoxed: rec.roundsBoxed ?? '',
      debutDate: rec.debutDate ? rec.debutDate.slice(0, 10) : '',
      wbc: pro.rankings?.wbc || '',
      wba: pro.rankings?.wba || '',
      ibf: pro.rankings?.ibf || '',
      wbo: pro.rankings?.wbo || '',
      other: pro.rankings?.other || '',
      promoterCompany: pro.promoters?.[0]?.company || '',
      managerName: pro.manager?.name || '',
      trainerName: pro.trainer?.name || '',
      cutmanName: pro.cutman?.name || '',
      agentName: pro.agent?.name || '',
      licenseNumber: pro.license?.number || '',
      licenseCommission: pro.license?.commission || '',
      licenseExpiry: pro.license?.expiryDate ? pro.license.expiryDate.slice(0, 10) : '',
      medicalSuspension: pro.medicals?.suspension || '',
      medicalNotes: pro.medicals?.notes || '',
      insuranceProvider: pro.insurance?.provider || '',
      insurancePolicy: pro.insurance?.policyNumber || '',
      insuranceExpiry: pro.insurance?.expiryDate ? pro.insurance.expiryDate.slice(0, 10) : '',
      instagram: pro.socials?.instagram || '',
      x: pro.socials?.x || '',
      facebook: pro.socials?.facebook || '',
      youtube: pro.socials?.youtube || '',
      emergencyName: pro.emergencyContact?.name || '',
      emergencyPhone: pro.emergencyContact?.phone || '',
      emergencyRelation: pro.emergencyContact?.relation || '',
      amateurRecord: pro.amateurBackground?.record || '',
      amateurAchievements: pro.amateurBackground?.achievements || '',
      olympics: pro.amateurBackground?.olympics || '',
      notes: b.notes || '',
      titlesText: (b.professional?.titles || []).map((t) => [t.organisation, t.title].filter(Boolean).join(' ').trim()).join(', '),
      slug: pro.slug || '',
      medLastExamDate: pro.medicals?.lastExamDate ? pro.medicals.lastExamDate.slice(0, 10) : '',
      medExpiryDate: pro.medicals?.expiryDate ? pro.medicals.expiryDate.slice(0, 10) : '',
      medBloodworkDate: pro.medicals?.bloodworkDate ? pro.medicals.bloodworkDate.slice(0, 10) : '',
      medMriDate: pro.medicals?.mriDate ? pro.medicals.mriDate.slice(0, 10) : '',
      medEyeTestDate: pro.medicals?.eyeTestDate ? pro.medicals.eyeTestDate.slice(0, 10) : '',
      medHepatitisB: Boolean(pro.medicals?.hepatitisB),
      medHepatitisC: Boolean(pro.medicals?.hepatitisC),
      medHiv: Boolean(pro.medicals?.hiv),
      medSuspension: pro.medicals?.suspension || '',
      medNotes: pro.medicals?.notes || '',
      medStatus: pro.medicals?.suspension && pro.medicals.suspension !== 'Cleared' ? 'suspended' : 'cleared',
    })
    setModalOpen(true)
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) {
      toast('Enter the boxer name', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        boxerType: 'professional',
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : null,
        nationality: form.nationality || '',
        professional: {
          ringName: form.ringName,
          nickname: form.nickname,
          country: form.country,
          countryCode: form.countryCode,
          nationality: form.nationality,
          residence: form.residence,
          heightCm: form.heightCm ? Number(form.heightCm) : null,
          reachCm: form.reachCm ? Number(form.reachCm) : null,
          stance: form.stance,
          division: form.division,
          careerHighWeightKg: form.careerHighWeightKg ? Number(form.careerHighWeightKg) : null,
          record: {
            wins: Number(form.wins) || 0,
            losses: Number(form.losses) || 0,
            draws: Number(form.draws) || 0,
            noContests: Number(form.noContests) || 0,
            koWins: Number(form.koWins) || 0,
            roundsBoxed: Number(form.roundsBoxed) || 0,
            debutDate: form.debutDate ? new Date(form.debutDate) : null,
          },
          rankings: { wbc: form.wbc, wba: form.wba, ibf: form.ibf, wbo: form.wbo, other: form.other },
          titles: editing?.professional?.titles || (String(form.titlesText || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((title) => ({ organisation: '', title, division: '', current: true, wonDate: null, lostDate: null }))),
          promoters: form.promoterCompany
            ? [{ name: form.fullName, company: form.promoterCompany, role: 'Lead Promoter', contact: '' }]
            : [],
          manager: form.managerName ? { name: form.managerName, contact: '' } : {},
          trainer: form.trainerName ? { name: form.trainerName, contact: '' } : {},
          cutman: form.cutmanName ? { name: form.cutmanName, contact: '' } : {},
          agent: form.agentName ? { name: form.agentName, contact: '' } : {},
          license: {
            number: form.licenseNumber,
            commission: form.licenseCommission,
            expiryDate: form.licenseExpiry ? new Date(form.licenseExpiry) : null,
          },
          medicals: {
            lastExamDate: form.medLastExamDate ? new Date(form.medLastExamDate) : null,
            expiryDate: form.medExpiryDate ? new Date(form.medExpiryDate) : null,
            bloodworkDate: form.medBloodworkDate ? new Date(form.medBloodworkDate) : null,
            mriDate: form.medMriDate ? new Date(form.medMriDate) : null,
            eyeTestDate: form.medEyeTestDate ? new Date(form.medEyeTestDate) : null,
            hepatitisB: Boolean(form.medHepatitisB),
            hepatitisC: Boolean(form.medHepatitisC),
            hiv: Boolean(form.medHiv),
            suspension: form.medSuspension,
            status: form.medStatus,
            notes: form.medNotes,
          },
          insurance: {
            provider: form.insuranceProvider,
            policyNumber: form.insurancePolicy,
            expiryDate: form.insuranceExpiry ? new Date(form.insuranceExpiry) : null,
          },
          photos: { headshotUrl: form.headshotUrl, fullBodyUrl: form.fullBodyUrl, countryFlagUrl: form.countryFlagUrl },
          socials: { instagram: form.instagram, x: form.x, facebook: form.facebook, youtube: form.youtube },
          emergencyContact: { name: form.emergencyName, phone: form.emergencyPhone, relation: form.emergencyRelation },
          amateurBackground: { record: form.amateurRecord, achievements: form.amateurAchievements, olympics: form.olympics },
          notes: form.notes,
        },
        slug: form.slug,
        notes: form.notes,
      }

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
      const rec = pro.record || {}
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
    return {
      total: pros.length,
      wins: totalWins,
      kos: totalKOs,
      titles: currentTitles,
    }
  }, [boxers])

  const setNum = (k) => (e) => setForm({ ...form, [k]: e.target.value })

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

      <div className="console-card mb-5 flex items-center justify-between gap-3 p-3">
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
                  const wins = rec.wins || 0
                  const losses = rec.losses || 0
                  const draws = rec.draws || 0
                  const kos = rec.koWins || 0
                  const height = pro.heightCm ? `${pro.heightCm}cm` : '—'
                  const reach = pro.reachCm ? `${pro.reachCm}cm` : '—'
                  const flag = pro.countryCode
                    ? String.fromCodePoint(127397 + pro.countryCode.toUpperCase().charCodeAt(0)) +
                      String.fromCodePoint(127397 + pro.countryCode.toUpperCase().charCodeAt(1))
                    : ''
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
                              {[pro.country || b.nationality || '—', flag].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone="blue" className="text-[11px]">{pro.division || '—'}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                          {pro.country || b.nationality || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700">
                          <span className="text-emerald-600">{wins}W</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-500">{losses}L</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-500">{draws}D</span>
                          {kos > 0 && <span className="ml-1 text-[10px] font-bold text-amber-600">{kos}KO</span>}
                          {(rec.roundsBoxed || 0) > 0 && <span className="ml-1 text-[10px] font-bold text-slate-500">{rec.roundsBoxed} rnd</span>}
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
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Full Name *" value={form.fullName} onChange={set('fullName')} required />
            <Input label="Ring Name" value={form.ringName} onChange={set('ringName')} placeholder="e.g. The Silverback" />
            <Input label="Nickname" value={form.nickname} onChange={set('nickname')} placeholder='e.g. "The Showstopper"' />
            <Select label="Gender" value={form.gender} onChange={set('gender')}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </Select>
            <Input label="Country" value={form.country} onChange={set('country')} placeholder="e.g. Rwanda" />
            <Input label="Country Code" value={form.countryCode} onChange={set('countryCode')} placeholder="RWA" />
            <Input label="Nationality" value={form.nationality} onChange={set('nationality')} placeholder="e.g. Rwandan" />
            <Input label="Residence" value={form.residence} onChange={set('residence')} placeholder="City, Country" />
            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            <Input label="Height (cm)" type="number" value={form.heightCm} onChange={set('heightCm')} placeholder="180" />
            <Input label="Reach (cm)" type="number" value={form.reachCm} onChange={set('reachCm')} placeholder="190" />
            <Select label="Stance" value={form.stance} onChange={set('stance')}>
              <option value="">Select stance</option>
              {STANCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Division" value={form.division} onChange={set('division')} placeholder="e.g. Welterweight" />
            <Input label="Public Slug" value={form.slug} onChange={set('slug')} placeholder="e.g. big-mike" />
            <Input label="Career High Weight (kg)" type="number" value={form.careerHighWeightKg} onChange={set('careerHighWeightKg')} placeholder="e.g. 74.5" />
            <Input label="Weight Category" value={form.weightCategory} onChange={set('weightCategory')} placeholder="e.g. 73–75 kg" />
            <Input label="Age Category" value={form.ageCategory} onChange={set('ageCategory')} placeholder="e.g. 25+" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Photos & Country Flag</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Input label="Headshot URL" value={form.headshotUrl} onChange={set('headshotUrl')} placeholder="https://…/headshot.jpg" />
              </div>
              <div>
                <Input label="Full Body URL" value={form.fullBodyUrl} onChange={set('fullBodyUrl')} placeholder="https://…/fullbody.jpg" />
              </div>
              <div>
                <Input label="Country Flag URL" value={form.countryFlagUrl} onChange={set('countryFlagUrl')} placeholder="https://…/flag.svg" />
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Headshot, full-body and country-flag photos are stored as URLs (S3, CDN or direct link) and appear on the public boxer profile.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Professional Record</p>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Input label="Wins" type="number" value={form.wins} onChange={setNum('wins')} />
              <Input label="Losses" type="number" value={form.losses} onChange={setNum('losses')} />
              <Input label="Draws" type="number" value={form.draws} onChange={setNum('draws')} />
              <Input label="KOs" type="number" value={form.koWins} onChange={setNum('koWins')} />
              <Input label="No Contests" type="number" value={form.noContests} onChange={setNum('noContests')} />
              <Input label="Rounds Boxed" type="number" value={form.roundsBoxed} onChange={setNum('roundsBoxed')} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input label="Pro Debut" type="date" value={form.debutDate} onChange={set('debutDate')} />
              <Input label="Titles (comma separated)" value={form.titlesText || ''} onChange={set('titlesText')} placeholder="e.g. WBC Welterweight, ABC Championship" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Rankings</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="WBC" value={form.wbc} onChange={set('wbc')} placeholder="e.g. #3" />
              <Input label="WBA" value={form.wba} onChange={set('wba')} placeholder="e.g. #1" />
              <Input label="IBF" value={form.ibf} onChange={set('ibf')} placeholder="e.g. #2" />
              <Input label="WBO" value={form.wbo} onChange={set('wbo')} placeholder="e.g. #4" />
              <Input label="Other" value={form.other} onChange={set('other')} placeholder="e.g. WBC Asia" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Team & Business</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="Promotion / Company" value={form.promoterCompany} onChange={set('promoterCompany')} placeholder="e.g. Bodymax Promotions" />
              <Input label="Manager" value={form.managerName} onChange={set('managerName')} placeholder="Manager name" />
              <Input label="Head Trainer" value={form.trainerName} onChange={set('trainerName')} placeholder="Head trainer" />
              <Input label="Cutman" value={form.cutmanName} onChange={set('cutmanName')} placeholder="Cutman name" />
              <Input label="Agent" value={form.agentName} onChange={set('agentName')} placeholder="Agent name" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Licence</p>
              <div className="grid gap-3">
                <Input label="Licence Number" value={form.licenseNumber} onChange={set('licenseNumber')} />
                <Input label="Licence Commission" value={form.licenseCommission} onChange={set('licenseCommission')} placeholder="e.g. Boxing Commission" />
                <Input label="Licence Expiry" type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Medicals</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Select label="Status" value={form.medStatus} onChange={set('medStatus')}>
                  <option value="cleared">Cleared</option>
                  <option value="suspended">Suspended</option>
                </Select>
                <Input label="Last Exam Date" type="date" value={form.medLastExamDate} onChange={set('medLastExamDate')} />
                <Input label="Medical Expiry" type="date" value={form.medExpiryDate} onChange={set('medExpiryDate')} />
                <Input label="Bloodwork Date" type="date" value={form.medBloodworkDate} onChange={set('medBloodworkDate')} />
                <Input label="MRI Date" type="date" value={form.medMriDate} onChange={set('medMriDate')} />
                <Input label="Eye Test Date" type="date" value={form.medEyeTestDate} onChange={set('medEyeTestDate')} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={form.medHepatitisB} onChange={(e) => setForm({ ...form, medHepatitisB: e.target.checked })} className="h-4 w-4 rounded" />
                  Hepatitis B
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={form.medHepatitisC} onChange={(e) => setForm({ ...form, medHepatitisC: e.target.checked })} className="h-4 w-4 rounded" />
                  Hepatitis C
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input type="checkbox" checked={form.medHiv} onChange={(e) => setForm({ ...form, medHiv: e.target.checked })} className="h-4 w-4 rounded" />
                  HIV
                </label>
              </div>
              <div className="mt-3 grid gap-3">
                <Input label="Suspension / Status" value={form.medSuspension} onChange={set('medSuspension')} placeholder="e.g. Cleared" />
                <Textarea label="Medical Notes" value={form.medNotes} onChange={set('medNotes')} rows={2} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Insurance</p>
              <div className="grid gap-3">
                <Input label="Provider" value={form.insuranceProvider} onChange={set('insuranceProvider')} />
                <Input label="Policy Number" value={form.insurancePolicy} onChange={set('insurancePolicy')} />
                <Input label="Expiry" type="date" value={form.insuranceExpiry} onChange={set('insuranceExpiry')} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Socials & Emergency Contact</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Instagram" value={form.instagram} onChange={set('instagram')} placeholder="@handle" />
              <Input label="X / Twitter" value={form.x} onChange={set('x')} placeholder="@handle" />
              <Input label="Facebook" value={form.facebook} onChange={set('facebook')} placeholder="@page" />
              <Input label="YouTube" value={form.youtube} onChange={set('youtube')} placeholder="@channel" />
              <Input label="Emergency Contact" value={form.emergencyName} onChange={set('emergencyName')} />
              <Input label="Emergency Phone" value={form.emergencyPhone} onChange={set('emergencyPhone')} />
              <Input label="Relation" value={form.emergencyRelation} onChange={set('emergencyRelation')} placeholder="e.g. Spouse" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amateur Background</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Textarea label="Amateur Record" value={form.amateurRecord} onChange={set('amateurRecord')} rows={2} />
              <Textarea label="Achievements" value={form.amateurAchievements} onChange={set('amateurAchievements')} rows={2} />
              <Textarea label="Olympics" value={form.olympics} onChange={set('olympics')} rows={2} />
            </div>
          </div>

          <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={2} placeholder="Internal promoter notes…" />
        </form>
      </Modal>
    </div>
  )
}
