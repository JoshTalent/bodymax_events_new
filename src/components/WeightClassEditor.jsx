import { Button } from './Button.jsx'
import { Icon } from './Icons.jsx'
import { STANDARD_WEIGHT_CLASSES, validateWeightClasses, weightClassLabel } from '../utils/weightClasses.js'
import { cn } from '../utils/cn.js'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10'

export default function WeightClassEditor({ value = [], onChange, disabled = false, className }) {
  const rows = Array.isArray(value) ? value : []
  const error = validateWeightClasses(rows)

  const update = (index, patch) => {
    // Any manual edit replaces a legacy display override.
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch, label: '' } : row)))
  }

  const addRow = () => onChange([...rows, { name: '', minKg: '', maxKg: '' }])
  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index))
  const useStandard = () => {
    if (rows.length > 0 && !window.confirm('Replace the current weight classes with the standard 13?')) return
    onChange(STANDARD_WEIGHT_CLASSES.map((cls) => ({ ...cls })))
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Weight classes</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Give each division a name and a weight limit. Boxers pick one of these when they register.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={useStandard} disabled={disabled}>
          <Icon name="sparkles" className="h-3.5 w-3.5" />
          Use standard 13
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-slate-700">No weight classes yet</p>
          <p className="mt-0.5 text-xs text-slate-500">Add your own, or load the standard 13 amateur classes.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => {
            const label = weightClassLabel(row)
            return (
              <div key={index} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="grid gap-2 sm:grid-cols-[1fr_96px_96px_auto]">
                  <input
                    className={inputClass}
                    value={row.name ?? ''}
                    onChange={(e) => update(index, { name: e.target.value })}
                    placeholder="Name (e.g. Flyweight)"
                    disabled={disabled}
                    aria-label={`Weight class ${index + 1} name`}
                  />
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.1"
                    value={row.minKg ?? ''}
                    onChange={(e) => update(index, { minKg: e.target.value })}
                    placeholder="Min kg"
                    disabled={disabled}
                    aria-label={`Weight class ${index + 1} minimum kg`}
                  />
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.1"
                    value={row.maxKg ?? ''}
                    onChange={(e) => update(index, { maxKg: e.target.value })}
                    placeholder="No max"
                    disabled={disabled}
                    aria-label={`Weight class ${index + 1} maximum kg`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={disabled}
                    className="flex h-10 items-center justify-center rounded-xl px-3 text-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    aria-label={`Remove weight class ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Shows as <span className="font-semibold text-slate-700">{label || 'a category'}</span>
                  {row.minKg !== '' && row.minKg !== null && row.minKg !== undefined &&
                  (row.maxKg === '' || row.maxKg === null || row.maxKg === undefined)
                    ? ' · open ended (no maximum)'
                    : ''}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}

      <Button type="button" variant="secondary" size="sm" onClick={addRow} disabled={disabled}>
        <Icon name="plus" className="h-3.5 w-3.5" />
        Add weight class
      </Button>
    </div>
  )
}
