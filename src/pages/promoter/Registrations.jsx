import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { StatusBadge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Textarea, Select } from '../../components/Field.jsx'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'needs_correction', label: 'Needs Correction' },
  { value: 'approved', label: 'Approved' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

export default function Registrations() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [regs, setRegs] = useState(null)
  const [filter, setFilter] = useState('all')
  const [openClub, setOpenClub] = useState(null)
  const [actionReg, setActionReg] = useState(null)
  const [action, setAction] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    api('/registrations').then((d) => setRegs(d.registrations)).catch(() => {})
  }
  useEffect(load, [])

  const isPromoter = user?.role === 'promoter'

  const filtered = regs
    ? filter === 'all'
      ? regs
      : regs.filter((r) => r.status === filter)
    : []

  const groups = []
  const seen = new Map()
  for (const r of filtered) {
    const clubKey = (r.clubName || r.clubId?.name || 'Other').trim()
    let g = seen.get(clubKey)
    if (!g) {
      g = { clubKey, regs: [] }
      seen.set(clubKey, g)
      groups.push(g)
    }
    g.regs.push(r)
  }
  groups.sort((a, b) => a.clubKey.localeCompare(b.clubKey))

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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
          <p className="text-sm text-slate-500">Review boxer registrations and confirm each entry</p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48">
          {filters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
      </div>

      {!regs ? (
        <Loading />
      ) : groups.length === 0 ? (
        <Empty title="No registrations" message="Share the registration link to get boxers signed up." />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.clubKey} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {g.clubKey.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{g.clubKey}</p>
                    <span className="text-xs text-slate-500">{g.regs.length} boxer{g.regs.length === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setOpenClub(openClub === g.clubKey ? null : g.clubKey)}>
                  {openClub === g.clubKey ? 'Close' : 'View Boxers'}
                </Button>
              </div>

              {openClub === g.clubKey && (
                <ul className="divide-y divide-slate-200 border-t border-slate-200 bg-slate-50/50">
                  {g.regs.map((r) => (
                    <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{r.boxerId?.fullName || 'Boxer'}</p>
                        <p className="text-sm text-slate-500">
                          {r.eventId?.name || 'Event'}
                          {r.category?.weight && ` · ${r.category.weight}`}
                          {r.category?.age && ` · ${r.category.age}`}
                          {r.numberOfBouts > 1 && ` · ${r.numberOfBouts} bouts`}
                        </p>
                        {r.promoterFeedback && <p className="mt-1 text-xs text-slate-800">Feedback: {r.promoterFeedback}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={r.status} />
                        {isPromoter && ['pending_approval', 'needs_correction'].includes(r.status) && (
                          <>
                            <Button size="sm" onClick={() => { setActionReg(r); setAction('approve') }}>Approve</Button>
                            <Button size="sm" variant="secondary" onClick={() => { setActionReg(r); setAction('needs_correction') }}>Fix</Button>
                            <Button size="sm" variant="danger" onClick={() => { setActionReg(r); setAction('reject') }}>Reject</Button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
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
    </div>
  )
}