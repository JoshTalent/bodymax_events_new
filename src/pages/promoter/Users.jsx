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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Create users who can sign in and manage the dashboard</p>
        </div>
        <Button onClick={openCreate}>+ Add User</Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {!users ? (
            <Loading />
          ) : rows.length === 0 ? (
            <Empty title="No users yet" message="Add your first user to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((u) => {
                    const isMe = me?._id === u._id || me?.id === u._id
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          {u.name}
                          {isMe && <Badge className="ml-2" tone="blue">You</Badge>}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <Badge tone={u.canManageUsers ? 'slate' : 'outline'}>
                            {u.canManageUsers ? 'Owner' : 'User'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => setConfirmDel(u)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

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