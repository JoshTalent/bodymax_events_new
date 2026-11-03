import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardBody } from '../../components/Card.jsx'
import { Loading, Empty, Spinner } from '../../components/Loading.jsx'
import { Badge } from '../../components/Badge.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Input } from '../../components/Field.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { Icon } from '../../components/Icons.jsx'

export default function Users() {
  const { user: me } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState(null)
  const [modal, setModal] = useState(null) // null | { mode: 'create' } | { mode: 'edit', user }
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [busyDel, setBusyDel] = useState(false)

  if (me?.canManageUsers === false) return <Navigate to="/app" replace />

  const load = () => {
    api('/users').then((d) => setUsers(d.users)).catch(() => {})
  }
  useEffect(load, [])

  const openCreate = () => {
    setForm({ name: '', email: '', password: '' })
    setModal({ mode: 'create' })
  }

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: '' })
    setModal({ mode: 'edit', user })
  }

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast('Name and email are required', 'error')
      return
    }
    if (modal.mode === 'create' && !form.password) {
      toast('Please set a password', 'error')
      return
    }
    setBusy(true)
    try {
      if (modal.mode === 'create') {
        await api('/users', { method: 'POST', body: form })
        toast('User created')
      } else {
        const body = { name: form.name, email: form.email }
        if (form.password) body.password = form.password
        await api(`/users?id=${modal.user._id}`, { method: 'PUT', body })
        toast('User updated')
      }
      setModal(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    setBusyDel(true)
    try {
      await api(`/users?id=${confirmDel._id}`, { method: 'DELETE' })
      toast('User deleted')
      setConfirmDel(null)
      load()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusyDel(false)
    }
  }

  const rows = useMemo(() => users || [], [users])

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Users"
        description="Invite trusted team members who can sign in and manage the console."
        actions={
          <Button onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 text-xs font-bold shadow-lg shadow-brand-600/25 hover:from-brand-700 hover:to-indigo-700">
            <Icon name="plus" className="h-4 w-4" />
            Add User
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="console-card flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon name="users" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team members</p>
            <p className="text-xl font-black leading-tight text-slate-900">{users ? rows.length : '—'}</p>
          </div>
        </div>
        <div className="console-card flex items-center gap-3 p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Icon name="shield" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owners</p>
            <p className="text-xl font-black leading-tight text-slate-900">{users ? rows.filter((u) => u.canManageUsers).length : '—'}</p>
          </div>
        </div>
      </div>

      <div className="console-card overflow-hidden">
        {!users ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title="No users yet" message="Add your first user to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-bold">Member</th>
                  <th className="px-5 py-3 font-bold">Email</th>
                  <th className="px-5 py-3 font-bold">Access</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((u) => {
                  const isMe = me?._id === u._id || me?.id === u._id
                  return (
                    <tr key={u._id} className="group transition hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-950 text-[10px] font-bold text-white">
                            {u.name?.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
                          </span>
                          <span className="font-bold text-slate-900">
                            {u.name}
                            {isMe && <Badge className="ml-2" tone="blue">You</Badge>}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={u.canManageUsers ? 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700' : 'inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600'}>
                          <Icon name={u.canManageUsers ? 'shield' : 'users'} className="h-3 w-3" />
                          {u.canManageUsers ? 'Owner' : 'User'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(u)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
                            Edit
                          </button>
                          <button onClick={() => setConfirmDel(u)} className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-50">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Add User' : 'Edit User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? <Spinner className="h-4 w-4 border-white" /> : modal?.mode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jean Claude" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
          <Input
            label={modal?.mode === 'create' ? 'Password' : 'Password (leave blank to keep current)'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimum 6 characters"
          />
        </div>
      </Modal>

      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Delete User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDel(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={busyDel}>
              {busyDel ? <Spinner className="h-4 w-4 border-white" /> : 'Delete'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <span className="font-semibold text-slate-900">{confirmDel?.name}</span> ({confirmDel?.email})? They will lose access immediately.
        </p>
      </Modal>
    </div>
  )
}