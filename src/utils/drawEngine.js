// Constraint-aware auto-draw engine.
//
// Rules an organiser can set before generating a draw:
//   1. Club  - never pair two boxers from the same club.
//   2. Bouts - group experience into ranges ("1-5 bouts can face each other").
//   3. Age   - group age into ranges ("20-26 years can face each other").
//
// Two boxers may be paired when they share at least one range in every
// dimension that has ranges configured. Ranges may overlap on purpose
// (20-26 and 26-31) so a 26 year old can meet either a 22 or a 30 year old.

export const ELIGIBLE_STATUS = [
  'approved',
  'eligible',
  'payment_confirmed',
  'weighed',
  'completed',
]

export const DEFAULT_RULES = {
  avoidSameClub: true,
  useExperience: false,
  experienceBands: [
    { min: 1, max: 5 },
    { min: 6, max: 10 },
  ],
  useAge: false,
  ageBands: [
    { min: 20, max: 26 },
    { min: 26, max: 31 },
  ],
  strict: false,
}

export function rulesStorageKey(eventId) {
  return `bodymax:drawRules:${eventId || 'default'}`
}

export function loadRules(eventId) {
  try {
    const raw = localStorage.getItem(rulesStorageKey(eventId))
    if (!raw) return { ...DEFAULT_RULES }
    return { ...DEFAULT_RULES, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_RULES }
  }
}

export function saveRules(eventId, rules) {
  try {
    localStorage.setItem(rulesStorageKey(eventId), JSON.stringify(rules))
  } catch {
    /* storage unavailable - rules simply won't persist */
  }
}

export function clubKeyOf(reg) {
  const clubId = reg.clubId?._id || reg.clubId || reg.boxerId?.clubId?._id || reg.boxerId?.clubId
  if (clubId) return `id:${String(clubId)}`
  const name = (reg.clubName || reg.boxerId?.clubName || '').trim().toLowerCase()
  return name ? `name:${name}` : ''
}

export function clubLabelOf(reg) {
  return reg.clubName || reg.clubId?.name || reg.boxerId?.clubName || 'Guest'
}

// "26-31", "20 - 26", "U20", "26 to 31" -> a usable lower bound
function parseAgeBand(value) {
  if (value === null || value === undefined || value === '') return null
  const text = String(value)
  const ranged = text.match(/(\d{1,2})\s*(?:-|–|—|to)\s*(\d{1,2})/i)
  if (ranged) {
    const lo = Number(ranged[1])
    if (Number.isFinite(lo) && lo > 0 && lo < 120) return lo
  }
  const single = text.match(/(\d{1,2})/)
  if (single) {
    const n = Number(single[1])
    if (Number.isFinite(n) && n > 0 && n < 120) return n
  }
  return null
}

function ageFromDateOfBirth(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const monthDiff = now.getMonth() - d.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age -= 1
  return age > 0 && age < 120 ? age : null
}

// Prefer the real date of birth, fall back to the age category ("26-31" -> 26)
export function ageOf(reg) {
  return (
    ageFromDateOfBirth(reg.boxerId?.dateOfBirth || reg.dateOfBirth) ??
    parseAgeBand(reg.category?.age || reg.boxerId?.ageCategory || '')
  )
}

export function boutsOf(reg) {
  const value = Number(reg.numberOfBouts ?? reg.boxerId?.numberOfBouts)
  return Number.isFinite(value) && value > 0 ? value : null
}

export function normalizeParticipant(reg) {
  return {
    id: String(reg._id),
    name: reg.boxerId?.fullName || 'Boxer',
    clubKey: clubKeyOf(reg),
    club: clubLabelOf(reg),
    bouts: boutsOf(reg),
    age: ageOf(reg),
    weight: reg.category?.weight || '',
    ageCategory: reg.category?.age || '',
  }
}

export function sanitizeBands(bands) {
  if (!Array.isArray(bands)) return []
  return bands
    .map((b) => ({ min: Number(b?.min), max: Number(b?.max) }))
    .filter((b) => Number.isFinite(b.min) && Number.isFinite(b.max) && b.max >= 0)
    .map((b) => (b.min > b.max ? { min: b.max, max: b.min } : b))
    .sort((x, y) => x.min - y.min)
}

const hasBands = (bands) => bands.length > 0
const within = (value, band) => Number.isFinite(value) && value >= band.min && value <= band.max
const sharesBand = (a, b, bands) => bands.some((band) => within(a, band) && within(b, band))

function canPair(x, y, pass, cfg) {
  if (cfg.avoidSameClub && x.clubKey && x.clubKey === y.clubKey) return false

  if (pass.experience && hasBands(cfg.experienceBands)) {
    if (x.bouts === null || y.bouts === null) return false
    if (!sharesBand(x.bouts, y.bouts, cfg.experienceBands)) return false
  }

  if (pass.age && hasBands(cfg.ageBands)) {
    if (x.age === null || y.age === null) return false
    if (!sharesBand(x.age, y.age, cfg.ageBands)) return false
  }

  return true
}

// Prefer the closest opponent: experience gap matters more, age gap breaks ties
function pairScore(x, y) {
  const boutGap = x.bouts === null || y.bouts === null ? 0 : Math.abs(x.bouts - y.bouts)
  const ageGap = x.age === null || y.age === null ? 0 : Math.abs(x.age - y.age)
  return boutGap * 100 + ageGap
}

function reasonFor(p, rest, cfg) {
  if (rest.length < 2) return 'Nobody else left to pair with'
  if (cfg.avoidSameClub && rest.every((o) => o.clubKey && o.clubKey === p.clubKey)) {
    return 'Only boxers from the same club remain'
  }
  if (hasBands(cfg.experienceBands) && p.bouts === null) return 'Bouts played not recorded'
  if (hasBands(cfg.ageBands) && p.age === null) return 'Age not recorded'
  if (hasBands(cfg.experienceBands)) return 'No opponent in their bouts range'
  if (hasBands(cfg.ageBands)) return 'No opponent in their age range'
  return 'No valid opponent available'
}

export function generatePairings(participants, rules = {}) {
  const cfg = {
    avoidSameClub: rules.avoidSameClub !== false,
    experienceBands: rules.useExperience ? sanitizeBands(rules.experienceBands) : [],
    ageBands: rules.useAge ? sanitizeBands(rules.ageBands) : [],
    strict: !!rules.strict,
  }

  const pool = participants.map(normalizeParticipant)
  const pairs = []
  let remaining = pool.slice()

  const passes = cfg.strict
    ? [{ experience: true, age: true }]
    : [
        { experience: true, age: true },
        { experience: true, age: false },
        { experience: false, age: true },
        { experience: false, age: false },
      ]

  for (const pass of passes) {
    while (remaining.length >= 2) {
      let best = null
      for (let i = 0; i < remaining.length; i++) {
        for (let j = i + 1; j < remaining.length; j++) {
          if (!canPair(remaining[i], remaining[j], pass, cfg)) continue
          const score = pairScore(remaining[i], remaining[j])
          if (!best || score < best.score) best = { i, j, score }
        }
      }
      if (!best) break
      pairs.push({ a: remaining[best.i], b: remaining[best.j] })
      remaining = remaining.filter((_, k) => k !== best.i && k !== best.j)
    }
  }

  const unpaired = remaining.map((p) => ({ ...p, reason: reasonFor(p, remaining, cfg) }))

  return {
    pairs,
    unpaired,
    summary: {
      boxers: pool.length,
      bouts: pairs.length,
      byes: unpaired.length,
    },
  }
}