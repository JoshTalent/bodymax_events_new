import { useEffect, useMemo, useState } from 'react'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { StatusBadge, Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Textarea, Input, Select } from '../../components/Field.jsx'
import { cn } from '../../utils/cn'

const STATUS_TABS = [
  { value: 'all', label: 'All Registrations' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'needs_correction', label: 'Needs Correction' },
  { value: 'approved', label: 'Approved' },
  { value: 'payment_confirmed', label: 'Payment Confirmed' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

const ACTIONABLE = ['pending_approval', 'needs_correction']

function initials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Registrations() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [regs, setRegs] = useState(null)
  const [filter, setFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [busyLoad, setBusyLoad] = useState(false)
  const [actionReg, setActionReg] = useState(null)
  const [action, setAction] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteBoxer, setDeleteBoxer] = useState(null)
  const [busyDelete, setBusyDelete] = useState(false)

  const load = () => {
    setBusyLoad(true)
    api('/registrations')
      .then((d) => setRegs(d.registrations))
      .catch(() => {})
      .finally(() => setBusyLoad(false))
  }
  useEffect(load, [])

  const isPromoter = user?.role === 'promoter'

  const counts = useMemo(() => {
    const c = { all: regs ? regs.length : 0 }
    for (const r of regs || []) c[r.status] = (c[r.status] || 0) + 1
    return c
  }, [regs])

  const eventOptions = useMemo(() => {
    const map = new Map()
    for (const r of regs || []) {
      const id = r.eventId?._id
      if (id) map.set(id, r.eventId.name || 'Event')
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [regs])

  const filtered = useMemo(() => {
    let list = regs || []
    if (filter !== 'all') list = list.filter((r) => r.status === filter)
    if (eventFilter !== 'all') list = list.filter((r) => r.eventId?._id === eventFilter)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          (r.boxerId?.fullName || '').toLowerCase().includes(q) ||
          (r.clubName || r.clubId?.name || '').toLowerCase().includes(q) ||
          (r.eventId?.name || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [regs, filter, eventFilter, search])

  const runAction = async () => {
    setBusy(true)
    try {
      await api(`/registrations/manage?id=${actionReg._id}`, { method: 'POST', body: { action, feedback } })
      toast('Updated')
      setActionReg(null)
      setFeedback('')
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    setBusyDelete(true)
    try {
      await api(`/boxers?id=${deleteBoxer._id}`, { method: 'DELETE' })
      toast(`Boxer "${deleteBoxer.fullName}" removed permanently`)
      setDeleteBoxer(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusyDelete(false)
    }
  }

  const categoryLabel = (r) => {
    const parts = []
    if (r.category?.age) parts.push(r.category.age)
    if (r.category?.weight) parts.push(r.category.weight)
    if (r.category?.gender) parts.push(r.category.gender === 'Mixed' ? 'Mixed' : r.category.gender)
    return parts
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
            <p className="mt-0.5 text-sm text-slate-500">Review boxer entries, manage approvals and keep every event on track</p>
          </div>
          <Button size="sm" variant="secondary" onClick={load} disabled={busyLoad}>
            {busyLoad ? <Spinner /> : null}
            {busyLoad ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {STATUS_TABS.map((t) => {
            const n = counts[t.value] || 0
            const active = filter === t.value
            return (
              <button
                key={t.value}
                onClick={() => setFilter(t.value)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left transition',
                  active
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm'
                )}
              >
                <p className={cn('text-lg font-bold leading-tight', active ? 'text-white' : 'text-slate-900')}>{n}</p>
                <p className={cn('text-xs leading-tight', active ? 'text-slate-300' : 'text-slate-500')}>{t.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-52 flex-1">
          <Input
            placeholder="Search by boxer, club or event…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-registrations"
          />
        </div>
        <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="w-56">
          <option value="all">All events</option>
          {eventOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </Select>
        <Badge tone="outline" className="px-3 py-1">
          {filtered.length} of {regs ? regs.length : 0}
        </Badge>
      </div>

      {!regs ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty
          title={regs.length === 0 ? 'No registrations yet' : 'No matching registrations'}
          message={
            regs.length === 0
              ? 'Share the registration link to get boxers signed up.'
              : 'Try a different status, event or search term.'
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">Boxer</th>
                  <th className="px-5 py-3 font-semibold">Club</th>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Bouts</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Registered</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const canAction = isPromoter && ACTIONABLE.includes(r.status)
                  const cat = categoryLabel(r)
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            {initials(r.boxerId?.fullName)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                            {r.promoterFeedback && (
                              <p className="max-w-56 truncate text-xs text-slate-600">Feedback: {r.promoterFeedback}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{r.clubName || r.clubId?.name || '—'}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800">{r.eventId?.name || 'Event'}</p>
                        <p className="text-xs text-slate-500">{fmtDate(r.eventId?.eventDate)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {cat.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {cat.map((c) => (
                              <span key={c} className="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                        {r.numberOfBouts > 1 && <span className="ml-1 text-xs text-slate-500">×{r.numberOfBouts}</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-slate-700">{r.numberOfBouts || 1}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">{fmtDate(r.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {canAction ? (
                            <>
                              <Button size="sm" onClick={() => { setActionReg(r); setAction('approve') }}>Approve</Button>
                              <Button size="sm" variant="secondary" onClick={() => { setActionReg(r); setAction('needs_correction') }}>Fix</Button>
                              <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('reject') }}>Reject</Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                          {isPromoter && (
                            <Button size="sm" variant="secondary" className="border-slate-300 text-slate-500 hover:border-rose-300 hover:text-rose-600" onClick={() => setDeleteBoxer(r.boxerId)}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={!!actionReg}
        onClose={() => setActionReg(null)}
        title="Confirm Action"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionReg(null)}>Cancel</Button>
            <Button onClick={runAction} disabled={busy} variant={action.includes('reject') ? 'danger' : 'primary'}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {actionReg?.boxerId?.fullName} — {actionReg?.clubName || actionReg?.clubId?.name} — {actionReg?.eventId?.name}
        </p>
        <div className="mt-4">
          <Textarea label="Feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
        </div>
      </Modal>

      <Modal
        open={!!deleteBoxer}
        onClose={() => setDeleteBoxer(null)}
        title="Delete Boxer Permanently"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteBoxer(null)}>Cancel</Button>
            <Button onClick={confirmDelete} disabled={busyDelete} variant="danger">
              {busyDelete ? <Spinner className="h-4 w-4 border-white" /> : 'Delete Permanently'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          You are about to permanently delete{' '}
          <span className="font-semibold text-slate-900">{deleteBoxer?.fullName || 'this boxer'}</span>.
        </p>
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          This removes them from every event — registrations, draws, weigh-ins and recorded results — and cannot be undone.
        </div>
      </Modal>
    </div>
  )
}