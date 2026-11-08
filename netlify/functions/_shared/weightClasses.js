// Server copy of shared/weightClasses.js.
// Keep in sync with that file. It is duplicated so Netlify's function bundler
// never has to resolve imports outside netlify/functions.

export const STANDARD_WEIGHT_CLASSES = [
  { name: 'Minimumweight', minKg: 46, maxKg: 48 },
  { name: 'Flyweight', minKg: 48, maxKg: 51 },
  { name: 'Bantamweight', minKg: 51, maxKg: 54 },
  { name: 'Featherweight', minKg: 54, maxKg: 57 },
  { name: 'Lightweight', minKg: 57, maxKg: 60 },
  { name: 'Light Welterweight', minKg: 60, maxKg: 63.5 },
  { name: 'Welterweight', minKg: 63.5, maxKg: 67 },
  { name: 'Light Middleweight', minKg: 67, maxKg: 71 },
  { name: 'Middleweight', minKg: 71, maxKg: 75 },
  { name: 'Light Heavyweight', minKg: 75, maxKg: 80 },
  { name: 'Cruiserweight', minKg: 80, maxKg: 86 },
  { name: 'Heavyweight', minKg: 86, maxKg: 92 },
  { name: 'Super Heavyweight', minKg: 92, maxKg: null },
]

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function formatKg(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)))
}

export function weightClassLimit(cls) {
  const min = toNumber(cls?.minKg)
  const max = toNumber(cls?.maxKg)
  if (min !== null && min > 0 && max !== null && max > 0) {
    return `${formatKg(min)}–${formatKg(max)} kg`
  }
  if (min !== null && min > 0) return `Over ${formatKg(min)} kg`
  if (max !== null && max > 0) return `Under ${formatKg(max)} kg`
  return ''
}

export function weightClassLabel(cls) {
  if (typeof cls === 'string') return cls.trim()
  const override = String(cls?.label ?? '').trim()
  if (override) return override
  const name = String(cls?.name ?? '').trim()
  const limit = weightClassLimit(cls)
  if (name && limit) return `${name} · ${limit}`
  return name || limit
}

export function normalizeWeightClass(input) {
  if (typeof input === 'string') {
    const label = input.trim()
    if (!label) return null
    return { name: label, minKg: null, maxKg: null, label }
  }
  if (!input || typeof input !== 'object') return null

  const name = String(input.name ?? '').trim()
  let minKg = toNumber(input.minKg)
  let maxKg = toNumber(input.maxKg)
  if (minKg !== null && maxKg !== null && maxKg < minKg) {
    ;[minKg, maxKg] = [maxKg, minKg]
  }
  const label = String(input.label ?? '').trim()
  if (!name && minKg === null && maxKg === null && !label) return null

  const out = { name, minKg, maxKg }
  if (label) out.label = label
  return out
}

export function normalizeWeightClasses(input) {
  if (!Array.isArray(input)) return []
  const seen = new Set()
  const out = []
  for (const raw of input) {
    const cls = normalizeWeightClass(raw)
    if (!cls) continue
    const label = weightClassLabel(cls)
    if (!label || seen.has(label)) continue
    seen.add(label)
    out.push(cls)
  }
  return out
}

export function weightCategoryLabels(classes) {
  return normalizeWeightClasses(classes).map(weightClassLabel).filter(Boolean)
}

export function weightClassesOfEvent(event) {
  const structured = normalizeWeightClasses(event?.weightClasses)
  if (structured.length) return structured
  return normalizeWeightClasses(event?.weightCategories)
}

export function validateWeightClasses(classes) {
  if (!Array.isArray(classes)) return ''
  for (const cls of classes) {
    if (!cls || typeof cls !== 'object') continue
    const min = toNumber(cls.minKg)
    const max = toNumber(cls.maxKg)
    if (min !== null && min <= 0) return 'Weight limits must be greater than zero'
    if (max !== null && max <= 0) return 'Weight limits must be greater than zero'
    if (min !== null && max !== null && max <= min) {
      return `${weightClassLabel(cls)}: the upper limit must be higher than the lower limit`
    }
  }
  return ''
}
