import { useState } from 'react'
import { api, setToken } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/Button.jsx'
import { Input } from '../components/Field.jsx'
import { Card, CardHeader, CardBody } from '../components/Card.jsx'
import { Spinner } from '../components/Loading.jsx'

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
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile and security</p>
      </div>

      <form onSubmit={saveProfile}>
        <Card>
          <CardHeader title="Profile" subtitle="Your name and login email" />
          <CardBody className="space-y-4">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {profileError && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-900">{profileError}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? <Spinner className="h-4 w-4 border-white" /> : 'Save Profile'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>

      <form onSubmit={savePassword}>
        <Card className="mt-6">
          <CardHeader title="Change Password" subtitle="Choose a strong password you don't use elsewhere" />
          <CardBody className="space-y-4">
            <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Minimum 6 characters" />
              <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
            </div>
            {passwordError && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-900">{passwordError}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? <Spinner className="h-4 w-4 border-white" /> : 'Update Password'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  )
}