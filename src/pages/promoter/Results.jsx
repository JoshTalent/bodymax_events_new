import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Select, Input, Textarea } from '../../components/Field.jsx'
import { cn } from '../../utils/cn.js'

const methods = ['Decision', 'KO', 'TKO', 'RSC', 'Disqualification', 'Walkover', 'Other']

const STATUS_STYLES = {
  scheduled: 'bg-blue-100 text-blue-800',
  ready: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  walkover: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  postponed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-slate-100 text-slate-600',
}

function StatusPill({ status }) {
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
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLES[status] || 'bg-slate-100 text-slate-700')}>
      {label[status] || status.replace('_', ' ')}
    </span>
  )
}

function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [bouts, setBouts] = useState(null)
  const [recordBout, setRecordBout] = useState(null)
  const [form, setForm] = useState({ winnerId: '', method: 'Decision', round: '', notes: '' })
  const [busy, setBusy] = useState(false)

  const load = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/bouts?eventId=${id}`).then((d) => setBouts(d.bouts)).catch(() => setBouts([]))
  }
  useEffect(load, [id])

  const openRecord = (b) => {
    setRecordBout(b)
    setForm({ winnerId: '', method: 'Decision', round: '', notes: '' })
  }

  const submit = async () => {
    if (!form.winnerId) return
    setBusy(true)
    try {
      await api(`/results/record?id=${recordBout._id}`, {
        method: 'POST',
        body: { ...form, round: form.round ? Number(form.round) : null },
      })
      toast(`Result recorded for Bout #${recordBout.boutNumber}`)
      setRecordBout(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!event) return <Loading />

  const ordered = bouts ? [...bouts].sort((a, b) => a.boutNumber - b.boutNumber) : []

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate(`/app/events/${id}`)} className="mb-1 text-sm text-brand-600 hover:underline">← Back to Event</button>
        <h1 className="text-2xl font-bold text-slate-900">Results</h1>
        <p className="text-sm text-slate-500">{event.name} · record the winner of each bout</p>
      </div>

      {!bouts ? (
        <Loading />
      ) : ordered.length === 0 ? (
        <Card>
          <Empty title="No bouts yet" message="Create a draw first — results are recorded per bout." action={<Button onClick={() => navigate(`/app/events/${id}/draws`)}>Go to Draws</Button>} />
        </Card>
      ) : (
        <Card>
          <div className="p-0">
            <ul className="divide-y divide-slate-200">
              {ordered.map((b, i) => {
                const a = b.boxerAId
                const bb = b.boxerBId
                const winnerId = b.winnerId ? String(b.winnerId._id || b.winnerId) : null
                const aWin = winnerId && a && String(a._id) === winnerId
                const bWin = winnerId && bb && String(bb._id) === winnerId
                const isWalkover = b.status === 'walkover'
                return (
                  <li key={b._id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-bold text-white">{i + 1}</span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bout #{b.boutNumber}</p>
                          <p className="text-xs text-slate-500">
                            {b.category?.weight || 'All weights'}
                            {b.category?.age ? ` · ${b.category.age}` : ''}
                            {b.ring ? ` · ${b.ring}` : ''}
                            {b.scheduledTime ? ` · ${b.scheduledTime}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={b.status} />
                        {a && bb && b.status !== 'completed' && (
                          <Button size="sm" onClick={() => openRecord(b)}>Record Result</Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                      <div className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 py-2', aWin ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white')}>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{initials(a?.boxerId?.fullName)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-base font-semibold text-slate-900">
                            {a?.boxerId?.fullName || <span className="italic text-slate-400">Bye</span>}
                          </span>
                          <span className="block truncate text-sm text-slate-500">{a?.boxerId?.clubName || a?.clubId?.name || 'Guest'}</span>
                        </span>
                        {aWin && <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">Winner</span>}
                      </div>
                      <span className="self-center text-xs font-bold uppercase tracking-widest text-slate-300">vs</span>
                      <div className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 py-2', bWin ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white')}>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{initials(bb?.boxerId?.fullName)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-base font-semibold text-slate-900">
                            {bb?.boxerId?.fullName || <span className="italic text-slate-400">Bye</span>}
                          </span>
                          <span className="block truncate text-sm text-slate-500">{bb?.boxerId?.clubName || bb?.clubId?.name || 'Guest'}</span>
                        </span>
                        {bWin && <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">Winner</span>}
                      </div>
                    </div>

                    {b.status === 'completed' && (
                      <p className="mt-2 text-sm text-emerald-700">
                        Result: <span className="font-bold">{b.winnerId?.boxerId?.fullName || (isWalkover ? (aWin ? a?.boxerId?.fullName : bb?.boxerId?.fullName) : '')}</span> wins by{' '}
                        <span className="font-semibold">{b.result?.method || 'Decision'}</span>
                        {b.result?.round ? ` in round ${b.result.round}` : ''}
                      </p>
                    )}
                    {isWalkover && b.status !== 'completed' && (
                      <p className="mt-2 text-sm text-amber-700">
                        Walkover — <span className="font-bold">{aWin ? a?.boxerId?.fullName : bb?.boxerId?.fullName}</span> advances without a contest.
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </Card>
      )}

      <Modal
        open={!!recordBout}
        onClose={() => setRecordBout(null)}
        title={`Record Result — Bout #${recordBout?.boutNumber || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRecordBout(null)}>Cancel</Button>
            <Button onClick={submit} disabled={busy || !form.winnerId}>
              {busy ? <Spinner className="h-4 w-4 border-white" /> : 'Confirm Result'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Winner" value={form.winnerId} onChange={(e) => setForm({ ...form, winnerId: e.target.value })}>
            <option value="">Select winner</option>
            {recordBout?.boxerAId && <option value={recordBout.boxerAId._id}>{recordBout.boxerAId.boxerId?.fullName}</option>}
            {recordBout?.boxerBId && <option value={recordBout.boxerBId._id}>{recordBout.boxerBId.boxerId?.fullName}</option>}
          </Select>
          <Select label="Method of Victory" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            {methods.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input label="Round Finished" type="number" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} placeholder="Optional" />
          <Textarea label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </div>
      </Modal>
    </div>
  )
}