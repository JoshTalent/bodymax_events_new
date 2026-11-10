import { Input, Select, Textarea } from './Field.jsx'

export const DIVISIONS = [
  'Heavyweight', 'Cruiserweight', 'Light Heavyweight', 'Super Middleweight', 'Middleweight',
  'Super Welterweight', 'Welterweight', 'Super Lightweight', 'Lightweight', 'Super Featherweight',
  'Featherweight', 'Super Bantamweight', 'Bantamweight', 'Super Flyweight', 'Flyweight',
  'Light Flyweight', 'Strawweight', 'Minimumweight',
]

export const STANCES = ['Orthodox', 'Southpaw', 'Switch']

export const emptyProBoxerForm = {
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
  notes: '',
  titlesText: '',
  slug: '',
}

const dateValue = (d) => (d ? String(d).slice(0, 10) : '')

export function proBoxerFormFrom(boxer = {}) {
  const pro = boxer.professional || {}
  const rec = pro.record || {}
  return {
    fullName: boxer.fullName || '',
    ringName: pro.ringName || '',
    nickname: pro.nickname || '',
    gender: boxer.gender || 'M',
    country: pro.country || '',
    countryCode: pro.countryCode || '',
    nationality: pro.nationality || boxer.nationality || '',
    residence: pro.residence || '',
    dateOfBirth: dateValue(boxer.dateOfBirth),
    heightCm: pro.heightCm ?? '',
    reachCm: pro.reachCm ?? '',
    stance: pro.stance || '',
    division: pro.division || '',
    careerHighWeightKg: pro.careerHighWeightKg ?? '',
    weightCategory: boxer.weightCategory || '',
    ageCategory: boxer.ageCategory || '',
    headshotUrl: pro.photos?.headshotUrl || boxer.photoUrl || '',
    fullBodyUrl: pro.photos?.fullBodyUrl || '',
    countryFlagUrl: pro.photos?.countryFlagUrl || '',
    wins: rec.wins ?? '',
    losses: rec.losses ?? '',
    draws: rec.draws ?? '',
    noContests: rec.noContests ?? '',
    koWins: rec.koWins ?? '',
    roundsBoxed: rec.roundsBoxed ?? '',
    debutDate: dateValue(rec.debutDate),
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
    licenseExpiry: dateValue(pro.license?.expiryDate),
    insuranceProvider: pro.insurance?.provider || '',
    insurancePolicy: pro.insurance?.policyNumber || '',
    insuranceExpiry: dateValue(pro.insurance?.expiryDate),
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
    medLastExamDate: dateValue(pro.medicals?.lastExamDate),
    medExpiryDate: dateValue(pro.medicals?.expiryDate),
    medBloodworkDate: dateValue(pro.medicals?.bloodworkDate),
    medMriDate: dateValue(pro.medicals?.mriDate),
    medEyeTestDate: dateValue(pro.medicals?.eyeTestDate),
    medHepatitisB: Boolean(pro.medicals?.hepatitisB),
    medHepatitisC: Boolean(pro.medicals?.hepatitisC),
    medHiv: Boolean(pro.medicals?.hiv),
    medSuspension: pro.medicals?.suspension || '',
    medNotes: pro.medicals?.notes || '',
    medStatus: pro.medicals?.suspension && pro.medicals.suspension !== 'Cleared' ? 'suspended' : 'cleared',
    notes: boxer.notes || '',
    titlesText: (pro.titles || []).map((t) => [t.organisation, t.title].filter(Boolean).join(' ').trim()).join(', '),
    slug: pro.slug || '',
  }
}

/**
 * Build a Boxer payload (used by both the global Pro Boxers admin and the
 * per-event fight-night roster). Accepts the form state plus the boxer's
 * existing titles so edits never wipe career titles.
 */
export function proBoxerPayload(form, existingTitles = []) {
  const typedTitles = String(form.titlesText || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((title) => ({ organisation: '', title, division: '', current: true, wonDate: null, lostDate: null }))

  return {
    fullName: String(form.fullName || '').trim(),
    boxerType: 'professional',
    gender: form.gender || null,
    dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : null,
    nationality: form.nationality || '',
    weightCategory: form.weightCategory || '',
    ageCategory: form.ageCategory || '',
    photoUrl: form.headshotUrl || '',
    slug: form.slug || '',
    notes: form.notes || '',
    professional: {
      ringName: form.ringName,
      nickname: form.nickname,
      slug: form.slug,
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
      titles: typedTitles.length ? typedTitles : existingTitles || [],
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
  }
}

export function ProBoxerFields({ form, setForm }) {
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const toggle = (key) => (e) => setForm({ ...form, [key]: e.target.checked })

  return (
    <div className="space-y-5">
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
          <Input label="Headshot URL" value={form.headshotUrl} onChange={set('headshotUrl')} placeholder="https://…/headshot.jpg" />
          <Input label="Full Body URL" value={form.fullBodyUrl} onChange={set('fullBodyUrl')} placeholder="https://…/fullbody.jpg" />
          <Input label="Country Flag URL" value={form.countryFlagUrl} onChange={set('countryFlagUrl')} placeholder="https://…/flag.svg" />
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Headshot, full-body and country-flag photos are stored as URLs (S3, CDN or direct link) and appear on the public boxer profile.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Professional Record</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Input label="Wins" type="number" value={form.wins} onChange={set('wins')} />
          <Input label="Losses" type="number" value={form.losses} onChange={set('losses')} />
          <Input label="Draws" type="number" value={form.draws} onChange={set('draws')} />
          <Input label="KOs" type="number" value={form.koWins} onChange={set('koWins')} />
          <Input label="No Contests" type="number" value={form.noContests} onChange={set('noContests')} />
          <Input label="Rounds Boxed" type="number" value={form.roundsBoxed} onChange={set('roundsBoxed')} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input label="Pro Debut" type="date" value={form.debutDate} onChange={set('debutDate')} />
          <Input label="Titles (comma separated)" value={form.titlesText} onChange={set('titlesText')} placeholder="e.g. WBC Welterweight, ABC Championship" />
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
          <div className="grid gap-3">
            <Select label="Status" value={form.medStatus} onChange={set('medStatus')}>
              <option value="cleared">Cleared</option>
              <option value="suspended">Suspended</option>
            </Select>
            <Input label="Last Exam Date" type="date" value={form.medLastExamDate} onChange={set('medLastExamDate')} />
            <Input label="Medical Expiry" type="date" value={form.medExpiryDate} onChange={set('medExpiryDate')} />
            <Input label="Bloodwork Date" type="date" value={form.medBloodworkDate} onChange={set('medBloodworkDate')} />
            <Input label="MRI Date" type="date" value={form.medMriDate} onChange={set('medMriDate')} />
            <Input label="Eye Test Date" type="date" value={form.medEyeTestDate} onChange={set('medEyeTestDate')} />
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <input type="checkbox" checked={form.medHepatitisB} onChange={toggle('medHepatitisB')} className="h-3.5 w-3.5 rounded" />
                Hep B
              </label>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <input type="checkbox" checked={form.medHepatitisC} onChange={toggle('medHepatitisC')} className="h-3.5 w-3.5 rounded" />
                Hep C
              </label>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <input type="checkbox" checked={form.medHiv} onChange={toggle('medHiv')} className="h-3.5 w-3.5 rounded" />
                HIV
              </label>
            </div>
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
    </div>
  )
}
