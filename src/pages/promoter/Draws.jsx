import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Input } from '../../components/Field.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Icon } from '../../components/Icons.jsx'
import { RadialProgress, BarList } from '../../components/Charts.jsx'
import { cn } from '../../utils/cn.js'
import {
  ELIGIBLE_STATUS,
  loadRules,
  saveRules,
  generatePairings,
} from '../../utils/drawEngine.js'

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10'

const fmtDate = (iso) => {
  if (!iso) return 'Date TBA'
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const initials = (name = '') =>
  name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'

const isRealBout = (b) => !!(b.boxerAId?.boxerId?.fullName) || !!(b.boxerBId?.boxerId?.fullName)

function StatusPill({ status }) {
  const map = {
    scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    ready: { label: 'Ready', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    in_progress: { label: 'Live', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    walkover: { label: 'Walkover', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    postponed: { label: 'Postponed', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  }
  const meta = map[status] || { label: (status || 'unknown').replace('_', ' '), cls: 'bg-slate-100 text-slate-600 ring-slate-200' }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset', meta.cls)}>
      <span className="h-1 w-1 rounded-full bg-current" />
      {meta.label}
    </span>
  )
}

function Corner({ reg, bout, side, onAddBoxer, onEditBoxer, onRemoveBoxer, disabled }) {
  const name = reg?.boxerId?.fullName
  const club = reg?.boxerId?.clubName || reg?.clubId?.name
  const isWinner = bout.winnerId && String(bout.winnerId) === String(reg?._id)
  const notEligible = reg?.status === 'not_eligible'
  const record = reg?.boxerId?.boxingRecord
  const photo = reg?.boxerId?.photoUrl

  if (!reg) {
    return (
      <button
        type="button"
        onClick={() => onAddBoxer(bout, side)}
        disabled={disabled}
        className="group flex min-h-[86px] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-brand-300 bg-brand-50/40 px-3 py-3 text-center transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-40"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm ring-1 ring-brand-200">
          <Icon name="plus" className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-bold text-brand-700">Add boxer</span>
        <span className="text-[10px] font-medium text-brand-400">Bye slot</span>
      </button>
    )
  }

  return (
    <div
      className={cn(
        'relative flex min-h-[86px] items-center gap-3 rounded-2xl border px-3 py-3 transition',
        notEligible
          ? 'border-rose-200 bg-rose-50/70'
          : isWinner
            ? 'border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-200'
            : 'border-slate-200 bg-white hover:border-slate-300'
      )}
    >
      {photo ? (
        <img
          src={photo}
          alt={name || 'Boxer'}
          className={cn(
            'h-11 w-11 shrink-0 rounded-xl object-cover shadow-sm ring-2',
            notEligible ? 'ring-rose-300' : isWinner ? 'ring-emerald-300' : 'ring-white'
          )}
        />
      ) : (
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white shadow-sm',
            notEligible
              ? 'bg-gradient-to-br from-rose-500 to-rose-700'
              : isWinner
                ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
                : 'bg-gradient-to-br from-slate-700 to-slate-950'
          )}
        >
          {initials(name)}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'truncate text-sm font-bold',
              notEligible ? 'text-rose-700 line-through decoration-rose-400' : isWinner ? 'text-emerald-900' : 'text-slate-900'
            )}
          >
            {name || 'Boxer'}
          </span>
          {isWinner && !notEligible && (
            <span className="shrink-0 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">Win</span>
          )}
          {notEligible && (
            <span className="shrink-0 rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">Ineligible</span>
          )}
        </span>
        <span className={cn('mt-0.5 block truncate text-[11px]', notEligible ? 'text-rose-500' : 'text-slate-500')}>
          {club || 'Unattached'}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1">
          {reg.category?.weight && (
            <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold', notEligible ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600')}>
              {reg.category.weight}
            </span>
          )}
          {reg.category?.age && (
            <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold', notEligible ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200')}>
              {reg.category.age}
            </span>
          )}
          {record && (
            <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
              {record.wins || 0}-{record.losses || 0}-{record.draws || 0}
            </span>
          )}
        </span>
      </span>

      <span className="flex shrink-0 flex-col gap-0.5">
        <button
          type="button"
          title="Edit boxer photo & details"
          onClick={() => onEditBoxer(reg, bout)}
          disabled={disabled}
          className="rounded-lg p-1.5 text-slate-300 transition hover:bg-brand-50 hover:text-brand-600 disabled:opacity-30"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
        </button>
        <button
          type="button"
          title="Remove boxer from this bout"
          onClick={() => onRemoveBoxer(bout, side)}
          disabled={disabled}
          className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
        >
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  )
}

function BoutCard({ bout, index, total, onEditBoxer, onRemoveBoxer, onSwap, onMove, onDeleteBout, onAddBoxer, disabled }) {
  const a = bout.boxerAId
  const b = bout.boxerBId
  const isBye = !a || !b
  const isDone = bout.status === 'completed' || bout.status === 'walkover'
  const resultLabel = bout.result?.method || (bout.status === 'walkover' ? 'Walkover' : 'Decision')
  const rounds = bout.numberOfRounds !== undefined ? Number(bout.numberOfRounds) : undefined
  const minutes = bout.minutesPerRound !== undefined ? Number(bout.minutesPerRound) : undefined

  return (
    <li className="group relative bg-white transition hover:bg-slate-50/40">
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          bout.status === 'completed'
            ? 'bg-emerald-400'
            : bout.status === 'in_progress'
              ? 'bg-amber-400'
              : isBye
                ? 'bg-brand-400'
                : 'bg-slate-200'
        )}
      />

      <div className="px-4 py-4 pl-5 sm:px-5 sm:py-5 sm:pl-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-sm">
              {bout.boutNumber}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Bout #{bout.boutNumber}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {bout.category?.weight || 'All weights'}
                </span>
                {bout.category?.age && (
                  <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                    {bout.category.age}
                  </span>
                )}
                {bout.category?.gender && (
                  <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                    {bout.category.gender === 'M' ? 'Male' : bout.category.gender === 'F' ? 'Female' : bout.category.gender}
                  </span>
                )}
                {isBye && !isDone && (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200">Bye</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="mr-1 flex items-center gap-1" title="Reorder bout">
              <button
                type="button"
                onClick={() => onMove(index, -1)}
                disabled={disabled || index === 0}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
              >
                <Icon name="chevronDown" className="h-3.5 w-3.5 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => onMove(index, 1)}
                disabled={disabled || index === total - 1}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
              >
                <Icon name="chevronDown" className="h-3.5 w-3.5" />
              </button>
            </div>
            {a && b && (
              <button
                type="button"
                onClick={() => onSwap(bout)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30"
              >
                <Icon name="activity" className="h-3.5 w-3.5" />
                Swap
              </button>
            )}
            <button
              type="button"
              title="Delete this bout"
              onClick={() => onDeleteBout(bout)}
              disabled={disabled}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
            <StatusPill status={bout.status} />
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="text-slate-500">Rounds: </span>
              <input
                type="number"
                value={rounds !== undefined ? String(rounds) : ''}
                onChange={(e) => {
                  const next = [...manualPairs]
                  next[index] = { ...next[index], rounds: e.target.value !== '' ? Number(e.target.value) : undefined }
                  setManualPairs(next)
                }}
                className="w-16 rounded-lg border border-slate-200 px-1.5 py-1.5 text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                min={1}
                defaultValue={rounds !== undefined ? String(rounds) : ''}
              />
              <span className="text-slate-500">Min/round: </span>
              <input
                type="number"
                value={minutes !== undefined ? String(minutes) : ''}
                onChange={(e) => {
                  const next = [...manualPairs]
                  next[index] = { ...next[index], minutes: e.target.value !== '' ? Number(e.target.value) : undefined }
                  setManualPairs(next)
                }}
                className="w-16 rounded-lg border border-slate-200 px-1.5 py-1.5 text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                min={1}
                defaultValue={minutes !== undefined ? String(minutes) : ''}
              />
              </div>
            </div>
          </div>

        <div className="mt-4 grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <Corner reg={a} bout={bout} side="A" onAddBoxer={onAddBoxer} onEditBoxer={onEditBoxer} onRemoveBoxer={onRemoveBoxer} disabled={disabled} />
          <div className="flex items-center justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black uppercase tracking-wide text-white shadow-sm ring-4 ring-white">
              vs
            </span>
          </div>
          <Corner reg={b} bout={bout} side="B" onAddBoxer={onAddBoxer} onEditBoxer={onEditBoxer} onRemoveBoxer={onRemoveBoxer} disabled={disabled} />
        </div>

        {isDone && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-100">
            <Icon name="checkCircle" className="h-3.5 w-3.5 text-emerald-600" />
            Result: {resultLabel}
            {bout.result?.round ? ` · Round ${bout.result.round}` : ''}
            {bout.result?.notes ? ` — ${bout.result.notes}` : ''}
          </div>
        )}
      </div>
    </li>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset transition',
        active
          ? 'bg-slate-900 text-white ring-slate-900 shadow-sm'
          : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'
      )}
    >
      {children}
    </button>
  )
}

function MiniStat({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-900 ring-slate-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  }
  return (
    <div className={cn('rounded-xl px-3 py-2.5 ring-1 ring-inset', tones[tone])}>
      <p className="text-lg font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
    </div>
  )
}

function MetricRow({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-900',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
  }
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <span className={cn('text-sm font-black', tones[tone])}>{value}</span>
    </div>
  )
}

function SelectedPlayer({ r }) {
  if (!r) return null
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-slate-50 px-2 py-1.5 ring-1 ring-inset ring-slate-200/70">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-950 text-[9px] font-bold text-white">
        {initials(r.boxerId?.fullName)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold text-slate-900">{r.boxerId?.fullName || 'Boxer'}</span>
        <span className="block truncate text-[10px] text-slate-500">
          {r.clubName || r.clubId?.name || 'Guest'}
          {r.category?.weight ? ` · ${r.category.weight}` : ''}
          {r.category?.age ? ` · ${r.category.age}` : ''}
        </span>
      </span>
    </div>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
        checked ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
      )}
    >
      <span className={cn('mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition', checked ? 'bg-brand-600' : 'bg-slate-300')}>
        <span className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-900">{label}</span>
        {description && <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">{description}</span>}
      </span>
    </button>
  )
}

function BandEditor({ bands, onChange, unit, disabled }) {
  const update = (i, key, value) =>
    onChange(bands.map((b, x) => (x === i ? { ...b, [key]: value === '' ? '' : Number(value) } : b)))

  return (
    <div className="space-y-2">
      {bands.length === 0 && (
        <p className="text-xs text-slate-500">No ranges yet — add one, or switch this rule off.</p>
      )}
      {bands.map((band, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={band.min}
            disabled={disabled}
            onChange={(e) => update(i, 'min', e.target.value)}
            className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-100"
            aria-label="Range start"
          />
          <span className="text-xs font-bold text-slate-400">to</span>
          <input
            type="number"
            min="0"
            value={band.max}
            disabled={disabled}
            onChange={(e) => update(i, 'max', e.target.value)}
            className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-100"
            aria-label="Range end"
          />
          <span className="text-xs font-semibold text-slate-500">{unit}</span>
          <button
            type="button"
            onClick={() => onChange(bands.filter((_, x) => x !== i))}
            disabled={disabled}
            className="ml-auto rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
            title="Remove this range"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...bands, { min: '', max: '' }])}
        disabled={disabled}
        className="text-[11px] font-bold text-brand-600 transition hover:text-brand-700 disabled:opacity-40"
      >
        + Add range
      </button>
    </div>
  )
}

function AutoDrawRulesModal({ open, onClose, rules, setRules, preview, scopeLabel, onGenerate, busy }) {
  const setBands = (key) => (bands) => setRules((r) => ({ ...r, [key]: bands }))
  const { summary, unpaired } = preview

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Smart Auto Draw${scopeLabel ? ` — ${scopeLabel}` : ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onGenerate} disabled={busy || summary.boxers === 0}>
            {busy ? <Spinner className="h-4 w-4 border-white" /> : 'Generate Auto Draw'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-white px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Icon name="sparkles" className="h-4 w-4" />
          </span>
          <p className="text-xs leading-relaxed text-slate-600">
            Set your matching rules and the system builds the draw for you. Boxers only meet someone they share a range with
            in every rule you switch on.
          </p>
        </div>

        <Toggle
          checked={rules.avoidSameClub}
          onChange={(v) => setRules((r) => ({ ...r, avoidSameClub: v }))}
          label="Never pair boxers from the same club"
          description="Two boxers registered under the same club or team cannot face each other."
        />

        <div className="rounded-xl border border-slate-200 p-3">
          <Toggle
            checked={rules.useExperience}
            onChange={(v) => setRules((r) => ({ ...r, useExperience: v }))}
            label="Match by bouts played"
            description="Group experience into ranges — boxers only fight others inside a shared range."
          />
          {rules.useExperience && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <BandEditor bands={rules.experienceBands} onChange={setBands('experienceBands')} unit="bouts" />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <Toggle
            checked={rules.useAge}
            onChange={(v) => setRules((r) => ({ ...r, useAge: v }))}
            label="Match by age"
            description="Group ages into ranges. Overlapping ranges are fine — a 26 year old can then meet either side."
          />
          {rules.useAge && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <BandEditor bands={rules.ageBands} onChange={setBands('ageBands')} unit="years" />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <Toggle
            checked={rules.useWeight}
            onChange={(v) => setRules((r) => ({ ...r, useWeight: v }))}
            label="Match by weight"
            description="Group weights into ranges so boxers only fight others in a shared weight range."
          />
          {rules.useWeight && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <BandEditor bands={rules.weightBands} onChange={setBands('weightBands')} unit="kg" />
              <p className="mt-2 text-[11px] text-slate-400">
                Uses the weigh-in weight when available, otherwise the weight the boxer registered with.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">When no valid opponent exists</label>
          <select
            value={rules.strict ? 'strict' : 'balanced'}
            onChange={(e) => setRules((r) => ({ ...r, strict: e.target.value === 'strict' }))}
            className={selectClass}
          >
            <option value="balanced">Relax rules only when needed to avoid a bye</option>
            <option value="strict">Never break the rules — leave a bye</option>
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700">
            <span className="font-black">{summary.bouts} bout{summary.bouts === 1 ? '' : 's'}</span> from{' '}
            {summary.boxers} eligible boxer{summary.boxers === 1 ? '' : 's'}
            {summary.byes > 0 && (
              <>
                {' '}· <span className="font-bold text-amber-700">{summary.byes} bye{summary.byes === 1 ? '' : 's'}</span>
              </>
            )}
          </p>
          {summary.boxers === 0 && (
            <p className="mt-1 text-xs text-amber-700">
              No eligible boxers in this category. Switch off the weight or age filter, or add boxers manually.
            </p>
          )}
          {unpaired.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
              {unpaired.map((p) => (
                <li key={p.id}>
                  <span className="font-semibold text-slate-700">{p.name}</span> — {p.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default function Draws() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState(null)
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [bouts, setBouts] = useState(null)

  const [manualOpen, setManualOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [manualPairs, setManualPairs] = useState([])
  const [building, setBuilding] = useState(false)
  const [addBoxerOpen, setAddBoxerOpen] = useState(false)
  const [addingBoxer, setAddingBoxer] = useState(false)
  const [addForm, setAddForm] = useState({ fullName: '', clubName: '', gender: '', weight: '', age: '' })

  const [editBoxer, setEditBoxer] = useState(null)
  const [editForm, setEditForm] = useState({ fullName: '', clubName: '', gender: '', weight: '', age: '', numberOfBouts: 1, numberOfRounds: 3, minutesPerRound: 3, photoUrl: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [acting, setActing] = useState(false)

  const [assignTarget, setAssignTarget] = useState(null)
  const [assignId, setAssignId] = useState('')
  const [savingAssign, setSavingAssign] = useState(false)
  const [assignForm, setAssignForm] = useState({ fullName: '', clubName: '', gender: '', weight: '', age: '' })
  const [showAddAssign, setShowAddAssign] = useState(false)
  const [addingAssign, setAddingAssign] = useState(false)

  const [rulesOpen, setRulesOpen] = useState(false)
  const [rules, setRules] = useState(() => loadRules(id))
  const [autoBusy, setAutoBusy] = useState(false)

  useEffect(() => {
    setRules(loadRules(id))
  }, [id])

  const loadEvent = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/registrations?eventId=${id}`).then((d) => setRegistrations(d.registrations)).catch(() => {})
  }
  useEffect(loadEvent, [id])

  const loadDraw = async (evtId, w, a) => {
    try {
      const d = await api(`/draws/get?eventId=${evtId}&weight=${encodeURIComponent(w || '')}&age=${encodeURIComponent(a || '')}`)
      setBouts(d.bouts || [])
    } catch {
      setBouts(null)
    }
  }

  useEffect(() => {
    if (event) loadDraw(id, weight, age)
    // eslint-disable-next-line
  }, [event])

  const selectWeight = async (w) => {
    setWeight(w)
    await loadDraw(id, w, age)
  }

  const selectAge = async (a) => {
    setAge(a)
    await loadDraw(id, weight, a)
  }

  const shareDraw = async () => {
    if (!event?.registrationToken) {
      toast('No public link available for this event', 'error')
      return
    }
    const url = `${window.location.origin}/draws/${event.registrationToken}`
    try {
      await navigator.clipboard.writeText(url)
      toast('Public draw link copied')
    } catch {
      toast(url, 'info')
    }
  }

  const eligible = useMemo(
    () =>
      (registrations || []).filter(
        (r) =>
          ELIGIBLE_STATUS.includes(r.status) &&
          (!weight || r.category?.weight === weight) &&
          (!age || r.category?.age === age)
      ),
    [registrations, weight, age]
  )

  const autoPreview = useMemo(() => generatePairings(eligible, rules), [eligible, rules])

  if (!event || !registrations) return <Loading />

  const ageCats = event.ageCategories || []
  const showAgeFilter = ageCats.length > 0
  const allById = new Map(registrations.map((r) => [String(r._id), r]))

  const hasDraw = (bouts || []).filter(isRealBout).length > 0

  // Boxers already placed in this category's draw are hidden to avoid duplicates
  const drawnIds = new Set(
    (bouts || [])
      .flatMap((b) => [b.boxerAId?._id, b.boxerBId?._id])
      .filter(Boolean)
      .map(String)
  )

  // For filling an empty "Bye" slot manually — all registered boxers not already placed
  const assignable = registrations.filter((r) => !drawnIds.has(String(r._id)))

  const openManual = () => {
    const r1 = hasDraw
      ? ordered
          .slice()
          .map((b) => ({ a: b.boxerAId?._id || '', b: b.boxerBId?._id || '', rounds: b.numberOfRounds || 3, minutes: b.minutesPerRound || 3 }))
      : []
    setManualPairs(r1.length ? r1 : [{ a: '', b: '', rounds: 3, minutes: 3 }])
    setEditMode(hasDraw)
    setAddForm({ fullName: '', clubName: '', gender: '', weight: weight || '', age: age || '' })
    setAddBoxerOpen(false)
    setManualOpen(true)
  }

  const usedIds = () => manualPairs.flatMap((p) => [p.a, p.b]).filter(Boolean)
  const assignedCount = usedIds().length
  const eligibleIdSet = new Set(eligible.map((r) => String(r._id)))
  const inDrawEligible = [...new Set(usedIds().map(String))].filter((rid) => eligibleIdSet.has(rid)).length
  const remainingCount = Math.max(eligible.length - inDrawEligible, 0)

  // In edit mode the current selection must stay visible in its own dropdown,
  // so only boxers used by *other* slots are filtered out.
  const available = (keepId) => {
    const list = eligible.slice()
    if (keepId && !list.some((r) => String(r._id) === String(keepId))) {
      const current = allById.get(String(keepId))
      if (current) list.unshift(current)
    }
    return list.filter((r) => {
      if (usedIds().includes(r._id) && r._id !== keepId) return false
      if (!editMode && drawnIds.has(String(r._id))) return false
      return true
    })
  }

  const setPair = (i, key) => (e) => {
    const next = [...manualPairs]
    next[i] = { ...next[i], [key]: e.target.value }
    if (key === 'a' || key === 'b') {
      // Also update rounds/minutes when boxer is selected
      const idx = manualPairs.findIndex(p => p.a === next[i].a || p.b === next[i].b)
      if (idx !== -1) {
        next[idx].rounds = next[idx].rounds || 3
        next[idx].minutes = next[idx].minutes || 3
      }
    }
    setManualPairs(next)
  }

  const addPair = () => setManualPairs([...manualPairs, { a: '', b: '', rounds: 3, minutes: 3 }])

  const removePair = (i) => setManualPairs(manualPairs.filter((_, x) => x !== i))

  const autoPair = () => {
    const pool = available()
    if (pool.length < 2) return
    const { pairs, unpaired } = generatePairings(pool, rules)
    const rows = [...manualPairs]
    pairs.forEach((p) => rows.push({ a: p.a.id, b: p.b.id, rounds: manualPairs[0]?.rounds || 3, minutes: manualPairs[0]?.minutes || 3 }))
    unpaired.forEach((p) => rows.push({ a: p.id, b: '', rounds: manualPairs[0]?.rounds || 3, minutes: manualPairs[0]?.minutes || 3 }))
    setManualPairs(rows)
    if (unpaired.length > 0) {
      toast(`${pairs.length} pairing(s) made, ${unpaired.length} boxer(s) left without a valid opponent`, 'info')
    }
  }

  const runSmartAuto = async () => {
    const { pairs, unpaired, summary } = generatePairings(eligible, rules)
    if (summary.boxers === 0) {
      toast('No eligible boxers to draw in this category', 'error')
      return
    }
    const scope = [weight || 'all weights', age || 'all ages'].join(' · ')
    if (hasDraw && !window.confirm(`This rebuilds the current draw for ${scope}. Continue?`)) return

    const bouts = [
      ...pairs.map((p) => ({ boxerAId: p.a.id, boxerBId: p.b.id, numberOfRounds: manualPairs[0]?.rounds, minutesPerRound: manualPairs[0]?.minutes })),
      ...unpaired.map((p) => ({ boxerAId: p.id, boxerBId: null, numberOfRounds: manualPairs[0]?.rounds, minutesPerRound: manualPairs[0]?.minutes })),
    ]

    setAutoBusy(true)
    try {
      await api(`/draws/manual?eventId=${id}`, {
        method: 'POST',
        body: { weight: weight || '', age: age || '', gender: '', bouts },
      })
      saveRules(id, rules)
      setRulesOpen(false)
      await loadDraw(id, weight, age)
      toast(
        unpaired.length > 0
          ? `Auto draw created — ${summary.bouts} bouts, ${unpaired.length} bye${unpaired.length === 1 ? '' : 's'}`
          : `Auto draw created — ${summary.bouts} bouts, no byes`
      )
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setAutoBusy(false)
    }
  }

  const addUnaffiliated = async () => {
    if (!addForm.fullName.trim()) {
      toast('Enter the boxer full name', 'error')
      return
    }
    setAddingBoxer(true)
    try {
      await api(`/draws/boxer?eventId=${id}`, {
        method: 'POST',
        body: {
          fullName: addForm.fullName.trim(),
          clubName: addForm.clubName.trim(),
          gender: addForm.gender || '',
          weight: addForm.weight || weight || '',
          age: addForm.age || age || '',
        },
      })
      toast('Boxer added — now assign them to a bout')
      await loadEvent()
      setAddForm({ fullName: '', clubName: '', gender: '', weight: '', age: '' })
      setAddBoxerOpen(false)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setAddingBoxer(false)
    }
  }

  const buildManual = async () => {
    const pairs = manualPairs
      .map((p) => ({ boxerAId: p.a || null, boxerBId: p.b || null, numberOfRounds: p.rounds, minutesPerRound: p.minutes }))
      .filter((p) => p.boxerAId || p.boxerBId)
    if (pairs.length === 0) {
      toast('Add at least one pairing', 'error')
      return
    }
    const missing = eligible.length - usedIds().length
    if (missing > 0) {
      if (!window.confirm(`${missing} eligible boxer(s) are not assigned. They won't be in the draw. Build anyway?`)) return
    }
    setBuilding(true)
    try {
      await api(`/draws/manual?eventId=${id}`, {
        method: 'POST',
        body: { weight: weight || '', age: age || '', gender: '', bouts: pairs },
      })
      toast(editMode ? 'Draw updated — the bout list has been rebuilt' : 'Draw created — bouts are now live')
      setManualOpen(false)
      await loadDraw(id, weight, age)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBuilding(false)
    }
  }

  const ordered = (bouts || []).slice().sort((a, b) => (a.sortOrder - b.sortOrder) || (a.boutNumber - b.boutNumber))

  const readyCount = ordered.filter((b) => b.boxerAId && b.boxerBId).length
  const byeCount = ordered.length - readyCount
  const completedCount = ordered.filter((b) => b.status === 'completed' || b.status === 'walkover').length
  const readiness = ordered.length ? Math.round((readyCount / ordered.length) * 100) : 0
  const unplaced = eligible.filter((r) => !drawnIds.has(String(r._id)))

  const categoryMix = Object.entries(
    ordered.reduce((acc, b) => {
      const key = b.category?.weight || 'Unassigned'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const reloadDraw = async () => {
    await loadDraw(id, weight, age)
    await loadEvent()
  }

  const persistOrder = async (next) => {
    setActing(true)
    try {
      const d = await api(`/bouts?eventId=${id}`, { method: 'POST', body: { order: next.map((b) => b._id) } })
      toast(d.message || 'Draw reordered')
      await reloadDraw()
    } catch (err) {
      toast(err.message, 'error')
      await reloadDraw()
    } finally {
      setActing(false)
    }
  }

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= ordered.length) return
    const next = ordered.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setBouts(next)
    persistOrder(next)
  }

  const swap = async (bout) => {
    setActing(true)
    try {
      await api(`/bout/boxer?boutId=${bout._id}`, { method: 'POST', body: { action: 'swap' } })
      toast('Sides swapped')
      await reloadDraw()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setActing(false)
    }
  }

  const removeBoxer = async (bout, side) => {
    const name = side === 'A' ? bout.boxerAId?.boxerId?.fullName : bout.boxerBId?.boxerId?.fullName
    if (!window.confirm(`Remove ${name || 'this boxer'} from Bout #${bout.boutNumber}? The bout becomes a walkover for the remaining boxer.`)) return
    setActing(true)
    try {
      await api(`/bout/boxer?boutId=${bout._id}`, { method: 'POST', body: { action: 'remove', side } })
      toast('Boxer removed — walkover awarded')
      await reloadDraw()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setActing(false)
    }
  }

  const deleteDraw = async () => {
    const n = ordered.length
    const scope = weight ? ` for ${weight}${age ? ` · ${age}` : ''}` : ''
    if (!window.confirm(`Delete ${n} bout${n === 1 ? '' : 's'} from this draw${scope}? Completed results will also be removed.`)) return
    setActing(true)
    try {
      const d = await api(`/draws/delete?eventId=${id}`, {
        method: 'POST',
        body: { boutIds: ordered.map((b) => b._id) },
      })
      toast(d.message || 'Draw deleted')
      await reloadDraw()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setActing(false)
    }
  }

  const deleteBout = async (bout) => {
    const name = bout.boxerAId?.boxerId?.fullName || bout.boxerBId?.boxerId?.fullName || 'this bout'
    if (!window.confirm(`Delete Bout #${bout.boutNumber} (${name}) from the draw? Completed results will also be removed.`)) return
    setActing(true)
    try {
      const d = await api(`/draws/delete?eventId=${id}`, {
        method: 'POST',
        body: { boutIds: [bout._id] },
      })
      toast(d.message || 'Bout deleted')
      await reloadDraw()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setActing(false)
    }
  }

  const openAssign = (bout, side) => {
    setAssignId('')
    setAssignForm({ fullName: '', clubName: '', gender: '', weight: '', age: '' })
    setShowAddAssign(false)
    setAssignTarget({ bout, side })
  }

  const saveAssign = async () => {
    if (!assignId) return
    setSavingAssign(true)
    try {
      await api(`/bout/boxer?boutId=${assignTarget.bout._id}`, {
        method: 'POST',
        body: { action: 'assign', side: assignTarget.side, registrationId: assignId },
      })
      toast('Boxer added to bout')
      setAssignTarget(null)
      setAssignId('')
      await reloadDraw()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSavingAssign(false)
    }
  }

  const addAndAssign = async () => {
    if (!assignForm.fullName.trim()) {
      toast('Enter the boxer full name', 'error')
      return
    }
    setAddingAssign(true)
    try {
      const d = await api(`/draws/boxer?eventId=${id}`, {
        method: 'POST',
        body: {
          fullName: assignForm.fullName.trim(),
          clubName: assignForm.clubName.trim(),
          gender: assignForm.gender || '',
          weight: assignForm.weight || weight || '',
          age: assignForm.age || age || '',
        },
      })
      await api(`/bout/boxer?boutId=${assignTarget.bout._id}`, {
        method: 'POST',
        body: { action: 'assign', side: assignTarget.side, registrationId: d.registration._id },
      })
      toast('Boxer added and placed in the bout')
      setAssignTarget(null)
      await reloadDraw()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setAddingAssign(false)
    }
  }

  const openEditBoxer = (reg) => {
    setEditBoxer(reg)
    setEditForm({
      fullName: reg?.boxerId?.fullName || '',
      clubName: reg?.clubName || reg?.boxerId?.clubName || '',
      gender: reg?.boxerId?.gender || reg?.category?.gender || '',
      weight: reg?.category?.weight || reg?.boxerId?.weightCategory || '',
      age: reg?.category?.age || reg?.boxerId?.ageCategory || '',
      numberOfBouts: reg?.numberOfBouts || 1,
      numberOfRounds: reg?.numberOfRounds || 3,
      minutesPerRound: reg?.minutesPerRound || 3,
      photoUrl: reg?.boxerId?.photoUrl || '',
    })
  }

  const saveEditBoxer = async () => {
    if (!editForm.fullName.trim()) {
      toast('Boxer name is required', 'error')
      return
    }
    setSavingEdit(true)
    try {
      await api(`/draws/boxer-update?registrationId=${editBoxer._id}`, {
        method: 'POST',
        body: {
          fullName: editForm.fullName,
          clubName: editForm.clubName,
          gender: editForm.gender || '',
          weight: editForm.weight || '',
          age: editForm.age || '',
          numberOfBouts: editForm.numberOfBouts,
          numberOfRounds: editForm.numberOfRounds,
          minutesPerRound: editForm.minutesPerRound,
          photoUrl: editForm.photoUrl || '',
        },
      })
      toast('Boxer details updated')
      setEditBoxer(null)
      await reloadDraw()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  const scopeLabel = [weight || 'All weights', age || 'All ages'].join(' · ')

  return (
    <div className="space-y-5">
      {/* Control room hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-5 py-6 text-white shadow-[0_30px_80px_-45px_rgba(2,6,23,0.9)] sm:px-7 sm:py-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => navigate(`/app/events/${id}`)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-slate-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
            >
              <Icon name="chevronRight" className="h-3.5 w-3.5 rotate-180" />
              Event command center
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300 ring-1 ring-inset ring-white/10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
              </span>
              Draw control room
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{event.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-[26px] font-black leading-tight tracking-tight sm:text-4xl">Bout pairings</h1>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-200 ring-1 ring-inset ring-white/15">
                  {scopeLabel}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-300 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" className="h-4 w-4 text-slate-500" />
                  {fmtDate(event.eventDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="flag" className="h-4 w-4 text-slate-500" />
                  {event.venue || 'Venue TBA'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="trophy" className="h-4 w-4 text-slate-500" />
                  {ordered.length} bout{ordered.length === 1 ? '' : 's'} on the card
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-9 border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={() => setRulesOpen(true)}
              >
                <Icon name="sparkles" className="mr-1.5 h-3.5 w-3.5" />
                Smart auto draw
              </Button>
              <Button size="sm" className="h-9" onClick={openManual}>
                <Icon name="plus" className="mr-1.5 h-3.5 w-3.5" />
                {hasDraw ? 'Update draw' : 'Create draw'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={shareDraw}
                disabled={!event?.registrationToken}
              >
                <Icon name="external" className="mr-1.5 h-3.5 w-3.5" />
                Share
              </Button>
              {hasDraw && (
                <button
                  onClick={deleteDraw}
                  disabled={acting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-rose-300 transition hover:bg-rose-500/15 hover:text-rose-200 disabled:opacity-40"
                >
                  <Icon name="close" className="h-3.5 w-3.5" />
                  Delete draw
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: 'Eligible boxers', value: eligible.length, hint: scopeLabel },
              { label: 'Bouts on card', value: ordered.length, hint: `${readyCount} ready to fight` },
              { label: 'Bye slots', value: byeCount, hint: byeCount ? 'Awaiting an opponent' : 'No byes' },
              { label: 'Completed', value: completedCount, hint: `${ordered.length - completedCount} remaining` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 backdrop-blur-sm">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{s.label}</p>
                <p className="mt-1 text-xl font-black leading-none text-white">{s.value}</p>
                <p className="mt-1 truncate text-[10px] font-medium text-slate-400">{s.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scope filters */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            <Icon name="scale" className="h-3.5 w-3.5" />
            Scope
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip active={!weight} onClick={() => selectWeight('')}>All weights</Chip>
            {(event.weightCategories || []).map((w) => (
              <Chip key={w} active={weight === w} onClick={() => selectWeight(w)}>{w}</Chip>
            ))}
          </div>
          {showAgeFilter && (
            <>
              <span className="mx-1 hidden h-4 w-px bg-slate-200 sm:block" />
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip active={!age} onClick={() => selectAge('')}>All ages</Chip>
                {ageCats.map((a) => (
                  <Chip key={a} active={age === a} onClick={() => selectAge(a)}>{a}</Chip>
                ))}
              </div>
            </>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {eligible.length} eligible
          </span>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Main fight card */}
        <div className="space-y-4 xl:col-span-2">
          {!hasDraw ? (
            <Card className="overflow-hidden">
              <div className="relative overflow-hidden px-6 py-10 text-center">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_65%)]" />
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/20">
                  <Icon name="trophy" className="h-6 w-6" />
                </span>
                <h3 className="relative mt-4 text-lg font-black tracking-tight text-slate-900">No bout pairings yet</h3>
                <p className="relative mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                  Build the fight card by hand or let Smart Auto Draw match boxers by age, weight, experience and club.
                </p>
                <div className="relative mt-5 flex flex-wrap justify-center gap-2">
                  <Button onClick={openManual}>
                    <Icon name="plus" className="mr-1.5 h-4 w-4" />
                    Create draw
                  </Button>
                  <Button variant="secondary" onClick={() => setRulesOpen(true)}>
                    <Icon name="sparkles" className="mr-1.5 h-4 w-4" />
                    Smart auto draw
                  </Button>
                </div>
              </div>
              {eligible.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Eligible boxers in scope · {eligible.length}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {eligible.map((r) => (
                      <span
                        key={r._id}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-950 text-[9px] font-bold text-white">
                          {initials(r.boxerId?.fullName)}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{r.boxerId?.fullName || 'Boxer'}</span>
                        {r.category?.weight && <span className="text-[10px] font-semibold text-slate-400">{r.category.weight}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Icon name="trophy" className="h-4 w-4 text-slate-400" />
                    Fight card
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {ordered.length} bout{ordered.length === 1 ? '' : 's'} · {scopeLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {acting && <Spinner className="h-4 w-4" />}
                  <span className="hidden text-[10px] font-semibold text-slate-400 sm:inline">Use the arrows to reorder</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{readyCount}/{ordered.length} ready</span>
                </div>
              </div>
              <ol className="divide-y divide-slate-100">
                {ordered.map((b, i) => (
                  <BoutCard
                    key={b._id}
                    bout={b}
                    index={i}
                    total={ordered.length}
                    onEditBoxer={openEditBoxer}
                    onRemoveBoxer={removeBoxer}
                    onSwap={swap}
                    onMove={move}
                    onDeleteBout={deleteBout}
                    onAddBoxer={openAssign}
                    disabled={acting}
                  />
                ))}
              </ol>
            </Card>
          )}
        </div>

        {/* Side intelligence */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">Draw readiness</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Corner coverage across the card</p>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <RadialProgress value={readiness} label="ready" size={112} stroke={10} color="#2563eb" />
              <div className="min-w-0 flex-1">
                <MetricRow label="Both corners" value={`${readyCount}/${ordered.length}`} tone="blue" />
                <MetricRow label="Bye slots" value={byeCount} tone={byeCount ? 'amber' : 'emerald'} />
                <MetricRow label="Completed" value={completedCount} tone="emerald" />
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Unplaced boxers</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">Eligible, not in this draw</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{unplaced.length}</span>
            </div>
            <div className="px-3 py-3">
              {unplaced.length === 0 ? (
                <p className="px-2 py-4 text-center text-[11px] font-medium text-slate-400">
                  Every eligible boxer is on the card.
                </p>
              ) : (
                <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {unplaced.map((r) => (
                    <li
                      key={r._id}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-950 text-[9px] font-bold text-white">
                        {initials(r.boxerId?.fullName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-bold text-slate-800">{r.boxerId?.fullName || 'Boxer'}</span>
                        <span className="block truncate text-[10px] text-slate-400">
                          {r.category?.weight || 'No weight'} · {r.clubName || r.clubId?.name || 'Unattached'}
                        </span>
                      </span>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">Category mix</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Bouts per weight class</p>
            </div>
            <div className="px-5 py-4">
              <BarList data={categoryMix} color="#4f46e5" />
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title={`${editMode ? 'Update' : 'Create'} Draw${weight ? ` — ${weight}` : ''}${age ? ` · ${age}` : ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button onClick={buildManual} disabled={building || assignedCount === 0}>
              {building ? <Spinner className="h-4 w-4 border-white" /> : editMode ? 'Save Changes' : 'Create Draw'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {editMode ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900">
              <Icon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p>Editing the current draw — tweak the pairings below and save to rebuild the bout list.</p>
            </div>
          ) : drawnIds.size > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>
                {drawnIds.size} boxer{drawnIds.size === 1 ? '' : 's'} already placed in this draw are hidden from the lists to avoid duplicates.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Eligible" value={eligible.length} />
            <MiniStat label="In draw" value={inDrawEligible} tone={inDrawEligible ? 'blue' : 'slate'} />
            <MiniStat label="Unassigned" value={remainingCount} tone={remainingCount > 0 ? 'amber' : 'emerald'} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-200/70">
            <p className="text-[11px] font-medium text-slate-500">
              {editMode
                ? 'Each pairing saves as one scheduled bout. Empty slots become walkover byes.'
                : 'Pair boxers into bouts. Empty slots become walkover byes.'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="secondary" onClick={addPair}>
                <Icon name="plus" className="mr-1 h-3 w-3" />
                Bout
              </Button>
              <Button size="sm" variant="secondary" onClick={autoPair} disabled={remainingCount === 0}>
                <Icon name="sparkles" className="mr-1 h-3 w-3" />
                Auto-pair
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setAddBoxerOpen((v) => !v)}>
                <Icon name="usersPlus" className="mr-1 h-3 w-3" />
                Boxer
              </Button>
            </div>
          </div>

          {addBoxerOpen && (
            <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/60 to-white p-4">
              <p className="text-sm font-bold text-slate-900">Add a boxer manually</p>
              <p className="mb-3 text-[11px] text-slate-500">Registered in this event and ready to pair below. Leave the club empty for an individual boxer.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Full Name" value={addForm.fullName} onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })} placeholder="e.g. James Mwangi" />
                </div>
                <div>
                  <Input label="Club / Team" value={addForm.clubName} onChange={(e) => setAddForm({ ...addForm, clubName: e.target.value })} placeholder="e.g. Tigers Boxing Club" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Gender</label>
                  <select value={addForm.gender} onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Weight Category</label>
                  {event.weightCategories?.length ? (
                    <select value={addForm.weight} onChange={(e) => setAddForm({ ...addForm, weight: e.target.value })} className={selectClass}>
                      <option value="">—</option>
                      {event.weightCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <Input value={addForm.weight} onChange={(e) => setAddForm({ ...addForm, weight: e.target.value })} placeholder="e.g. 60kg" />
                  )}
                </div>
                {ageCats.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">Age Category</label>
                    <select value={addForm.age} onChange={(e) => setAddForm({ ...addForm, age: e.target.value })} className={selectClass}>
                      <option value="">—</option>
                      {ageCats.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={addUnaffiliated} disabled={addingBoxer}>
                  {addingBoxer ? <Spinner className="h-4 w-4 border-white" /> : 'Add & Register'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setAddBoxerOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {manualPairs.length === 0 ? (
            <Empty title="No bouts yet" message="Add a bout to start pairing boxers." />
          ) : (
            <div className="space-y-2.5">
              {manualPairs.map((p, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-[10px] font-black text-white">{i + 1}</span>
                      Bout {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePair(i)}
                      className="rounded-md px-2 py-1 text-[11px] font-bold text-rose-500 transition hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
                    <div className="min-w-0">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Boxer A</label>
                      <select value={p.a} onChange={setPair(i, 'a')} className={selectClass}>
                        <option value="">— Bye / empty —</option>
                        {available(p.a).map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.boxerId?.fullName || 'Boxer'} — {r.clubName || r.clubId?.name || 'Guest'}
                            {r.category?.weight ? ` (${r.category.weight})` : ''}
                          </option>
                        ))}
                      </select>
                      <SelectedPlayer r={p.a ? allById.get(p.a) : null} />
                    </div>
                    <span className="hidden self-center pt-5 text-[10px] font-black tracking-widest text-slate-300 sm:block">VS</span>
                    <div className="min-w-0">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Boxer B</label>
                      <select value={p.b} onChange={setPair(i, 'b')} className={selectClass}>
                        <option value="">— Bye / empty —</option>
                        {available(p.b).map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.boxerId?.fullName || 'Boxer'} — {r.clubName || r.clubId?.name || 'Guest'}
                            {r.category?.weight ? ` (${r.category.weight})` : ''}
                          </option>
                        ))}
                      </select>
                      <SelectedPlayer r={p.b ? allById.get(p.b) : null} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!editBoxer}
        onClose={() => setEditBoxer(null)}
        title={`Edit Boxer — ${editBoxer?.boxerId?.fullName || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditBoxer(null)}>Cancel</Button>
            <Button onClick={saveEditBoxer} disabled={savingEdit}>
              {savingEdit ? <Spinner className="h-4 w-4 border-white" /> : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-start gap-4">
              {editForm.photoUrl ? (
                <img
                  src={editForm.photoUrl}
                  alt={editForm.fullName || 'Boxer'}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm ring-2 ring-white"
                />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-950 text-lg font-black text-white shadow-sm">
                  {initials(editForm.fullName)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <Input
                  label="Photo link"
                  type="url"
                  value={editForm.photoUrl}
                  onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                  placeholder="https://example.com/boxer-photo.jpg"
                />
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] leading-relaxed text-slate-400">
                    Paste a public image link (JPG, PNG or WebP).
                  </p>
                  {editForm.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, photoUrl: '' }))}
                      className="rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Input label="Full Name" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
          <Input label="Club / Team" value={editForm.clubName} onChange={(e) => setEditForm({ ...editForm, clubName: e.target.value })} placeholder="e.g. Midlands Boxing Club" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Weight Category</label>
              <select value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} className={selectClass}>
                <option value="">—</option>
                {event.weightCategories?.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Age Category</label>
              <select value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} className={selectClass}>
                <option value="">—</option>
                {ageCats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Gender</label>
              <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className={selectClass}>
                <option value="">—</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <Input label="Number of Bouts" type="number" min="1" value={editForm.numberOfBouts} onChange={(e) => setEditForm({ ...editForm, numberOfBouts: e.target.value })} />
          </div>
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            Changes update the boxer's profile and this event's registration. Use Update Draw to re-pair boxers after changing weights.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={`Add Boxer — Bout #${assignTarget?.bout.boutNumber} (${assignTarget?.side === 'A' ? 'Boxer A' : 'Boxer B'})`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignTarget(null)}>Cancel</Button>
            <Button onClick={saveAssign} disabled={savingAssign || !assignId}>
              {savingAssign ? <Spinner className="h-4 w-4 border-white" /> : 'Add Boxer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {assignable.length === 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>Every registered boxer is already placed in this draw. Add a brand new boxer below to fill the slot.</p>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-xs leading-relaxed text-slate-500">
                Fill the empty slot with a boxer. Boxers already placed in this draw are hidden. The bout becomes scheduled once both sides are filled.
              </p>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Select Boxer</label>
              <select value={assignId} onChange={(e) => setAssignId(e.target.value)} className={selectClass}>
                <option value="">— Select a boxer —</option>
                {assignable.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.boxerId?.fullName || 'Boxer'} — {r.clubName || r.clubId?.name || 'Guest'}
                    {r.category?.weight ? ` (${r.category.weight}` : ' (—'}
                    {r.category?.age ? ` · ${r.category.age}` : ''}
                    {`) · ${r.status.replace('_', ' ')}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60">
            <button
              type="button"
              onClick={() => setShowAddAssign((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-bold text-brand-700 transition hover:bg-brand-50/50"
            >
              <span className="flex items-center gap-2">
                <Icon name="plus" className="h-3.5 w-3.5" />
                Add a new boxer manually
              </span>
              <span className="text-lg leading-none text-slate-400">{showAddAssign ? '−' : '+'}</span>
            </button>

            {showAddAssign && (
              <div className="space-y-3 px-3 pb-3">
                <p className="text-[11px] text-slate-500">
                  Creates a registration in this event, then places the boxer in the empty slot. Leave the club empty for an individual boxer.
                </p>
                <Input label="Full Name" value={assignForm.fullName} onChange={(e) => setAssignForm({ ...assignForm, fullName: e.target.value })} placeholder="e.g. Kevin Otieno" />
                <Input label="Club / Team" value={assignForm.clubName} onChange={(e) => setAssignForm({ ...assignForm, clubName: e.target.value })} placeholder="e.g. Cobra Boxing Club" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">Gender</label>
                    <select value={assignForm.gender} onChange={(e) => setAssignForm({ ...assignForm, gender: e.target.value })} className={selectClass}>
                      <option value="">—</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">Weight Category</label>
                    {event.weightCategories?.length ? (
                      <select value={assignForm.weight} onChange={(e) => setAssignForm({ ...assignForm, weight: e.target.value })} className={selectClass}>
                        <option value="">—</option>
                        {event.weightCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <Input value={assignForm.weight} onChange={(e) => setAssignForm({ ...assignForm, weight: e.target.value })} placeholder="e.g. 60kg" />
                    )}
                  </div>
                  {ageCats.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">Age Category</label>
                      <select value={assignForm.age} onChange={(e) => setAssignForm({ ...assignForm, age: e.target.value })} className={selectClass}>
                        <option value="">—</option>
                        {ageCats.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <Button size="sm" onClick={addAndAssign} disabled={addingAssign}>
                  {addingAssign ? <Spinner className="h-4 w-4 border-white" /> : 'Add Boxer & Assign to Bout'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <AutoDrawRulesModal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        rules={rules}
        setRules={setRules}
        preview={autoPreview}
        scopeLabel={scopeLabel}
        onGenerate={runSmartAuto}
        busy={autoBusy}
      />
    </div>
  )
}
