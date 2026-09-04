import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Select, Input } from '../../components/Field.jsx'
import { Modal } from '../../components/Modal.jsx'
import { cn } from '../../utils/cn.js'

function BoutCard({ bout, index, total, onEditBoxer, onRemoveBoxer, onSwap, onMove, onDeleteBout, onAddBoxer, disabled }) {
  const a = bout.boxerAId
  const b = bout.boxerBId
  const aName = a?.boxerId?.fullName
  const bName = b?.boxerId?.fullName
  const aClub = a?.boxerId?.clubName || a?.clubId?.name
  const bClub = b?.boxerId?.clubName || b?.clubId?.name
  const winnerId = bout.winnerId

  const slot = (reg, name, club, side) => {
    const isWinner = winnerId && String(winnerId) === String(reg?._id)
    const notEligible = reg?.status === 'not_eligible'
    return (
      <div className={cn(
        'relative flex flex-1 items-center gap-3 rounded-xl border px-3 py-2',
        !reg
          ? 'border-dashed border-brand-300 bg-brand-50/40'
          : notEligible
            ? 'border-rose-300 bg-rose-50'
            : isWinner
              ? 'border-emerald-200 bg-emerald-50'
              : bout.status === 'completed'
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-200 bg-white'
      )}>
        {!reg ? (
          <button
            type="button"
            onClick={() => onAddBoxer(bout, side)}
            disabled={disabled}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Boxer
            <span className="text-xs font-medium text-brand-400">(Bye)</span>
          </button>
        ) : (
          <>
            <span className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              notEligible
                ? 'bg-rose-600 text-white'
                : isWinner
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600'
            )}>
              {name?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '—'}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn(
                'block truncate text-sm font-semibold',
                notEligible ? 'text-rose-700 line-through decoration-rose-400' : isWinner ? 'text-emerald-900' : 'text-slate-900'
              )}>
                {name || <span className="italic text-slate-400">Bye</span>}
                {isWinner && !notEligible && <span className="ml-1.5 text-xs font-bold text-emerald-600">WINNER</span>}
                {notEligible && <span className="ml-1.5 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Not Eligible</span>}
              </span>
              <span className={cn('block truncate text-xs', notEligible ? 'text-rose-500' : 'text-slate-500')}>{club || 'Guest'}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                title="Edit boxer"
                onClick={() => onEditBoxer(reg, bout)}
                disabled={disabled}
                className="rounded-md p-1 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600 disabled:opacity-30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </button>
              <button
                type="button"
                title="Remove boxer from draw"
                onClick={() => onRemoveBoxer(bout, side)}
                disabled={disabled}
                className="rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-bold text-white">
            {index + 1}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bout #{bout.boutNumber}</p>
            <p className="text-xs text-slate-500">
              {bout.category?.weight || 'All weights'}
              {bout.category?.age ? ` · ${bout.category.age}` : ''}
              {bout.category?.gender ? ` · ${bout.category.gender}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-1 flex items-center" title="Reorder">
            <button
              type="button"
              onClick={() => onMove(index, -1)}
              disabled={disabled || index === 0}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
            </button>
            <button
              type="button"
              onClick={() => onMove(index, 1)}
              disabled={disabled || index === total - 1}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
          </div>
          {a && b && (
            <Button size="sm" variant="secondary" onClick={() => onSwap(bout)} disabled={disabled}>Swap</Button>
          )}
          <button
            type="button"
            title="Delete this bout"
            onClick={() => onDeleteBout(bout)}
            disabled={disabled}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
          <StatusPill status={bout.status} />
        </div>
      </div>

      <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {slot(a, aName, aClub, 'A')}
        <span className="px-1 text-center text-xs font-bold uppercase tracking-widest text-slate-300">vs</span>
        {slot(b, bName, bClub, 'B')}
      </div>

      {(bout.status === 'completed' || bout.status === 'walkover') && (
        <p className="mt-2 text-xs text-emerald-700">
          Result: {bout.result?.method || bout.status === 'walkover' ? 'Walkover' : 'Decision'}{bout.result?.round ? ` · ${bout.result.round}` : ''}
          {bout.result?.notes ? ` — ${bout.result.notes}` : ''}
        </p>
      )}
    </li>
  )
}

function StatusPill({ status }) {
  const map = {
    scheduled: 'bg-blue-100 text-blue-800',
    ready: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-amber-100 text-amber-800',
    walkover: 'bg-amber-100 text-amber-800',
    completed: 'bg-emerald-100 text-emerald-800',
    postponed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-slate-100 text-slate-600',
  }
  const label = {
    scheduled: 'Scheduled',
    ready: 'Ready',
    in_progress: 'In Progress',
    walkover: 'Walkover',
    completed: 'Completed',
    postponed: 'Postponed',
    cancelled: 'Cancelled',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', map[status] || 'bg-slate-100 text-slate-700')}>
      {label[status] || status.replace('_', ' ')}
    </span>
  )
}

const selectClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

function Stat({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white',
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    emerald: 'border-emerald-200 bg-emerald-50',
  }
  return (
    <div className={cn('rounded-xl border px-3 py-2.5 text-center', tones[tone])}>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  )
}

function SelectedPlayer({ r }) {
  if (!r) return null
  const initials = (r.boxerId?.fullName || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{initials}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</span>
        <span className="block truncate text-xs text-slate-500">
          {r.clubName || r.clubId?.name || 'Guest'}
          {r.category?.weight ? ` · ${r.category.weight}` : ''}
          {r.category?.age ? ` · ${r.category.age}` : ''}
        </span>
      </span>
    </div>
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
  const [addForm, setAddForm] = useState({ fullName: '', gender: '', weight: '', age: '' })

  const [editBoxer, setEditBoxer] = useState(null)
  const [editForm, setEditForm] = useState({ fullName: '', clubName: '', gender: '', weight: '', age: '', numberOfBouts: 1 })
  const [savingEdit, setSavingEdit] = useState(false)
  const [acting, setActing] = useState(false)

  const [assignTarget, setAssignTarget] = useState(null)
  const [assignId, setAssignId] = useState('')
  const [savingAssign, setSavingAssign] = useState(false)
  const [assignForm, setAssignForm] = useState({ fullName: '', gender: '', weight: '', age: '' })
  const [showAddAssign, setShowAddAssign] = useState(false)
  const [addingAssign, setAddingAssign] = useState(false)

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

  if (!event || !registrations) return <Loading />

  const eligible = registrations.filter((r) =>
    ['approved', 'eligible', 'payment_confirmed', 'weighed', 'completed'].includes(r.status) &&
    (!weight || r.category?.weight === weight) &&
    (!age || r.category?.age === age)
  )

  const ageCats = event.ageCategories || []
  const showAgeFilter = ageCats.length > 0
  const byId = new Map(eligible.map((r) => [r._id, r]))

  const hasDraw = (bouts?.length || 0) > 0

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
          .map((b) => ({ a: b.boxerAId?._id || '', b: b.boxerBId?._id || '' }))
      : []
    setManualPairs(r1.length ? r1 : [{ a: '', b: '' }])
    setEditMode(hasDraw)
    setAddForm({ fullName: '', gender: '', weight: weight || '', age: age || '' })
    setAddBoxerOpen(false)
    setManualOpen(true)
  }

  const usedIds = () => manualPairs.flatMap((p) => [p.a, p.b]).filter(Boolean)
  const assignedCount = usedIds().length
  const remainingCount = eligible.length - assignedCount

  const available = (exclude = []) =>
    eligible.filter(
      (r) =>
        !usedIds().includes(r._id) &&
        !exclude.includes(r._id) &&
        (editMode || !drawnIds.has(String(r._id)))
    )

  const setPair = (i, key) => (e) => {
    const next = [...manualPairs]
    next[i] = { ...next[i], [key]: e.target.value }
    setManualPairs(next)
  }

  const addPair = () => setManualPairs([...manualPairs, { a: '', b: '' }])

  const removePair = (i) => setManualPairs(manualPairs.filter((_, x) => x !== i))

  const autoPair = () => {
    const pool = available().slice()
    const rows = [...manualPairs]

    const used = new Set(rows.flatMap((p) => [p.a, p.b]).filter(Boolean).map(String))
    const remaining = pool.filter((r) => !used.has(String(r._id)))

    // Match boxers from different clubs first to avoid same-club pairings.
    while (remaining.length >= 2) {
      let a = remaining.shift()
      let b = remaining.find((x) => x.clubName !== a.clubName)
      let bIdx = b ? remaining.indexOf(b) : -1

      if (bIdx === -1) {
        // No different-club opponent left; pair from same club as a fallback.
        b = remaining[0]
        bIdx = 0
      }
      remaining.splice(bIdx, 1)
      rows.push({ a: a._id, b: b._id })
    }
    if (remaining.length === 1) {
      rows.push({ a: remaining.pop()._id, b: '' })
    }
    setManualPairs(rows)
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
          gender: addForm.gender || '',
          weight: addForm.weight || weight || '',
          age: addForm.age || age || '',
        },
      })
      toast('Boxer added — now assign them to a bout')
      await loadEvent()
      setAddForm({ fullName: '', gender: '', weight: '', age: '' })
      setAddBoxerOpen(false)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setAddingBoxer(false)
    }
  }

  const buildManual = async () => {
    const pairs = manualPairs
      .map((p) => ({ boxerAId: p.a || null, boxerBId: p.b || null }))
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

  const reloadDraw = async () => {
    await loadDraw(id, weight, age)
    await loadEvent()
  }

  const persistOrder = async (next) => {
    setActing(true)
    try {
      const d = await api(`/bouts?eventId=${id}`, { method: 'POST', body: { order: next.map((b) => b._id) } })
      setBouts(d.bouts)
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
    setAssignForm({ fullName: '', gender: '', weight: '', age: '' })
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

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate(`/app/events/${id}`)} className="mb-1 text-sm text-brand-600 hover:underline">← Back to Event</button>
        <h1 className="text-2xl font-bold text-slate-900">Draw & Bouts</h1>
        <p className="text-sm text-slate-500">{event.name} · pair boxers into bouts for this event</p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Select label="Weight Category" value={weight} onChange={(e) => selectWeight(e.target.value)}>
            <option value="">All weights</option>
            {event.weightCategories?.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </Select>
        </div>
        {showAgeFilter && (
          <div className="w-56">
            <Select label="Age Category" value={age} onChange={(e) => selectAge(e.target.value)}>
              <option value="">All ages</option>
              {ageCats.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openManual} disabled={eligible.length < 1}>
            {hasDraw ? 'Update Draw' : 'Create Draw'}
          </Button>
          {hasDraw && (
            <Button variant="danger" onClick={deleteDraw} disabled={acting}>
              Delete Draw
            </Button>
          )}
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
            {eligible.length} eligible
          </span>
        </div>
      </div>

      {!hasDraw ? (
        <Card>
          <Empty
            title="No bouts yet"
            message="Create a draw for this category — pair boxers yourself, add guest boxers if needed, and publish the bout list."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Bout List" subtitle={`${ordered.length} bout${ordered.length === 1 ? '' : 's'} scheduled — record results on the Bouts page`} />
          <CardBody>
            <ul className="divide-y divide-slate-200">
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
            </ul>
          </CardBody>
        </Card>
      )}

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
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">✓</span>
              <p>Editing the current drawing — tweak the pairings below and save to rebuild the bout list.</p>
            </div>
          ) : drawnIds.size > 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <span className="text-amber-600">!</span>
              <p>
                {drawnIds.size} boxer{drawnIds.size === 1 ? '' : 's'} already placed in this drawing are hidden from the lists to avoid duplicates.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Eligible" value={eligible.length} />
            <Stat label="In Draw" value={assignedCount} tone={assignedCount ? 'blue' : 'slate'} />
            <Stat label="Unassigned" value={remainingCount} tone={remainingCount > 0 ? 'amber' : 'emerald'} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-sm text-slate-600">
              {editMode
                ? 'Each pairing saves as one scheduled bout. Empty slots become walkover byes.'
                : 'Pair boxers into bouts. Empty slots become walkover byes.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={addPair}>+ Bout</Button>
              <Button size="sm" variant="secondary" onClick={autoPair} disabled={remainingCount === 0}>Auto-pair</Button>
              <Button size="sm" variant="secondary" onClick={() => setAddBoxerOpen((v) => !v)}>+ Add boxer</Button>
            </div>
          </div>

          {addBoxerOpen && (
            <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/60 to-white p-4">
              <p className="text-sm font-semibold text-slate-900">Add a boxer who isn't on any club</p>
              <p className="mb-3 text-xs text-slate-500">Registered in this event and ready to pair below.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Full Name" value={addForm.fullName} onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })} placeholder="e.g. James Mwangi" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</label>
                  <select value={addForm.gender} onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Weight Category</label>
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
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Age Category</label>
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
            <div className="space-y-3">
              {manualPairs.map((p, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bout {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removePair(i)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Boxer A</label>
                      <select value={p.a} onChange={setPair(i, 'a')} className={selectClass}>
                        <option value="">— Bye / empty —</option>
                        {available([p.a]).map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.boxerId?.fullName || 'Boxer'} — {r.clubName || r.clubId?.name || 'Guest'}
                            {r.category?.weight ? ` (${r.category.weight})` : ''}
                          </option>
                        ))}
                      </select>
                      <SelectedPlayer r={p.a ? byId.get(p.a) : null} />
                    </div>
                    <span className="mt-4 text-sm font-bold text-slate-300">VS</span>
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Boxer B</label>
                      <select value={p.b} onChange={setPair(i, 'b')} className={selectClass}>
                        <option value="">— Bye / empty —</option>
                        {available([p.b]).map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.boxerId?.fullName || 'Boxer'} — {r.clubName || r.clubId?.name || 'Guest'}
                            {r.category?.weight ? ` (${r.category.weight})` : ''}
                          </option>
                        ))}
                      </select>
                      <SelectedPlayer r={p.b ? byId.get(p.b) : null} />
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
          <Input label="Full Name" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
          <Input label="Club / Team" value={editForm.clubName} onChange={(e) => setEditForm({ ...editForm, clubName: e.target.value })} placeholder="e.g. Midlands Boxing Club" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Weight Category</label>
              <select value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} className={selectClass}>
                <option value="">—</option>
                {event.weightCategories?.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Age Category</label>
              <select value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} className={selectClass}>
                <option value="">—</option>
                {ageCats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Gender</label>
              <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className={selectClass}>
                <option value="">—</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <Input label="Number of Bouts" type="number" min="1" value={editForm.numberOfBouts} onChange={(e) => setEditForm({ ...editForm, numberOfBouts: e.target.value })} />
          </div>
          <p className="text-xs text-slate-400">
            Changes update the boxer's profile and this event's registration. Use the Update Draw option to re-pair boxers after changing weights.
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
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <span className="text-amber-600">!</span>
              <p>Every registered boxer is already placed in this draw. Add a brand new boxer below to fill the slot.</p>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-slate-600">
                Fill the empty slot with a boxer. Boxers already placed in this draw are hidden. The bout becomes scheduled once both sides are filled.
              </p>
              <label className="mb-1 block text-sm font-medium text-slate-700">Select Boxer</label>
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

          <div className="rounded-xl border border-slate-200 bg-slate-50/60">
            <button
              type="button"
              onClick={() => setShowAddAssign((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-brand-700 transition hover:bg-brand-50/50"
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add a new boxer manually
              </span>
              <span className="text-lg leading-none text-slate-400">{showAddAssign ? '−' : '+'}</span>
            </button>

            {showAddAssign && (
              <div className="space-y-3 px-3 pb-3">
                <p className="text-xs text-slate-500">Creates a registration in this event, then places the boxer in the empty slot.</p>
                <Input label="Full Name" value={assignForm.fullName} onChange={(e) => setAssignForm({ ...assignForm, fullName: e.target.value })} placeholder="e.g. Kevin Otieno" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</label>
                    <select value={assignForm.gender} onChange={(e) => setAssignForm({ ...assignForm, gender: e.target.value })} className={selectClass}>
                      <option value="">—</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Weight Category</label>
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
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Age Category</label>
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
    </div>
  )
}