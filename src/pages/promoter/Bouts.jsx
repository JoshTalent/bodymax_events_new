import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardHeader, CardBody } from '../../components/Card.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input, Select } from '../../components/Field.jsx'
import { cn } from '../../utils/cn.js'

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

export default function Bouts() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [bouts, setBouts] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ring: '', scheduledDate: '', scheduledTime: '', status: 'scheduled' })
  const [busy, setBusy] = useState(false)
  const [reordering, setReordering] = useState(false)

  const load = () => {
    api(`/events?id=${id}`).then((d) => setEvent(d.event)).catch(() => {})
    api(`/bouts?eventId=${id}`).then((d) => setBouts(d.bouts)).catch(() => setBouts([]))
  }
  useEffect(load, [id])

  const ordered = (bouts || []).slice().sort((a, b) => (a.sortOrder - b.sortOrder) || (a.boutNumber - b.boutNumber))

  const persistOrder = async (next) => {
    setReordering(true)
    try {
      const d = await api(`/bouts?eventId=${id}`, { method: 'POST', body: { order: next.map((b) => b._id) } })
      setBouts(d.bouts)
    } catch (err) {
      toast(err.message, 'error')
      load()
    } finally {
      setReordering(false)
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

  const openEdit = (b) => {
    setEditing(b)
    setForm({
      ring: b.ring || '',
      scheduledDate: b.scheduledDate ? b.scheduledDate.slice(0, 10) : '',
      scheduledTime: b.scheduledTime || '',
      status: b.status || 'scheduled',
    })
  }

  const submit = async () => {
    setBusy(true)
    try {
      await api(`/bouts?id=${editing._id}`, {
        method: 'PATCH',
        body: {
          ring: form.ring,
          scheduledDate: form.scheduledDate ? new Date(form.scheduledDate) : null,
          scheduledTime: form.scheduledTime,
          status: form.status,
        },
      })
      toast('Bout updated')
      setEditing(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!event || !bouts) return <Loading />

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate(`/app/events/${id}`)} className="mb-1 text-sm text-brand-600 hover:underline">← Back to Event</button>
        <h1 className="text-2xl font-bold text-slate-900">Bout Schedule</h1>
        <p className="text-sm text-slate-500">{event.name} · use the arrows to arrange the fight order</p>
      </div>

      {ordered.length === 0 ? (
        <Card>
          <Empty title="No bouts yet" message="Generate a draw first to create fights." action={<Button onClick={() => navigate(`/app/events/${id}/draws`)}>Go to Draws</Button>} />
        </Card>
      ) : (
        <Card>
          <div className="p-0">
            <ul className="divide-y divide-slate-200">
              {ordered.map((b, i) => (
                <li key={b._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-900">
                        {b.boxerAId?.boxerId?.fullName || 'TBD'} vs {b.boxerBId?.boxerId?.fullName || 'TBD'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {b.category?.weight || 'All weights'}
                        {b.category?.age ? ` / ${b.category.age}` : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      #{b.boutNumber}
                      {b.ring && ` · Ring ${b.ring}`}
                      {b.scheduledDate && ` · ${new Date(b.scheduledDate).toLocaleDateString()}`}
                      {b.scheduledTime && ` · ${b.scheduledTime}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1" title="Reorder">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={reordering || i === 0}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={reordering || i === ordered.length - 1}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                    </div>
                    <StatusPill status={b.status} />
                    <Button size="sm" variant="secondary" onClick={() => openEdit(b)}>Schedule</Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Schedule Bout #${editing?.boutNumber || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Ring" value={form.ring} onChange={(e) => setForm({ ...form, ring: e.target.value })} placeholder="e.g. Ring 1" />
          <Input label="Date" type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
          <Input label="Time" type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="scheduled">Scheduled</option>
            <option value="ready">Ready</option>
            <option value="in_progress">In Progress</option>
            <option value="postponed">Postponed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </Modal>
    </div>
  )
}
