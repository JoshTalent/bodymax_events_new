import { useState } from 'react'
import { api, setToken } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/Button.jsx'
import { Input } from '../components/Field.jsx'
import { Card, CardHeader, CardBody } from '../components/Card.jsx'
import { Spinner } from '../components/Loading.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { Icon } from '../components/Icons.jsx'

export default function Settings() {
  const { user, loadMe } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const saveProfile = async (e) => {
    e.preventDefault()
    setProfileError('')
    setSavingProfile(true)
    try {
      const data = await api('/auth/update', { method: 'PATCH', body: { name, email } })
      if (data.token) setToken(data.token)
      await loadMe()
      toast('Profile updated')
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      await api('/auth/update', { method: 'POST', body: { action: 'change_password', currentPassword, newPassword } })
      toast('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, sign-in details and account security."
      />

      <div className="grid gap-5 lg:grid-cols-[280px,1fr]">
        <aside className="space-y-4">
          <div className="console-card p-5 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-xl font-black text-white shadow-lg">
              {(user?.name || 'B').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </span>
            <p className="mt-3 truncate text-sm font-bold text-slate-900">{user?.name || 'Manager'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-inset ring-brand-100">
              <Icon name="shield" className="h-3 w-3" />
              {user?.role === 'promoter' ? 'Manager' : user?.role || 'Member'}
            </span>
          </div>

          <div className="console-card p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Icon name="shield" className="h-4 w-4" />
              </span>
              <p className="text-xs font-bold text-slate-900">Security tip</p>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Use a unique password with at least 8 characters. Never share your manager credentials with clubs or officials.
            </p>
          </div>
        </aside>

        <div className="space-y-5">
          <form onSubmit={saveProfile}>
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon name="users" className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Profile</h3>
                  <p className="text-xs text-slate-500">Your name and login email</p>
                </div>
              </div>
              <CardBody className="space-y-4">
                <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                {profileError && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{profileError}</p>}
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingProfile} className="inline-flex items-center gap-2">
                    {savingProfile ? <Spinner className="h-4 w-4 border-white" /> : <Icon name="check" className="h-4 w-4" />}
                    Save Profile
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>

          <form onSubmit={savePassword}>
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Icon name="shield" className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
                  <p className="text-xs text-slate-500">Choose a strong password you don't use elsewhere</p>
                </div>
              </div>
              <CardBody className="space-y-4">
                <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Minimum 6 characters" />
                  <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                </div>
                {passwordError && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{passwordError}</p>}
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingPassword} className="inline-flex items-center gap-2">
                    {savingPassword ? <Spinner className="h-4 w-4 border-white" /> : <Icon name="shield" className="h-4 w-4" />}
                    Update Password
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}