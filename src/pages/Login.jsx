import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Button } from '../components/Button.jsx'
import { Input } from '../components/Field.jsx'
import { Spinner } from '../components/Loading.jsx'
import { Icon } from '../components/Icons.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/app')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-ink-900">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 left-1/4 h-[480px] w-[480px] rounded-full bg-indigo-600/20 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="hidden lg:block">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-blue-600 to-indigo-700 text-xl font-black text-white shadow-xl shadow-brand-900/40">
              B
            </span>
            <div>
              <p className="text-xl font-black tracking-tight text-white">Bodymax</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Events Platform</p>
            </div>
          </div>

          <h1 className="mt-10 max-w-lg text-4xl font-black leading-[1.08] tracking-tight text-white xl:text-5xl">
            Run every fight night from one{' '}
            <span className="bg-gradient-to-r from-brand-300 to-indigo-300 bg-clip-text text-transparent">command center.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Registrations, weigh-ins, draws, results and staff portals — built for promoters and managers who need the whole card under control.
          </p>

          <div className="mt-9 grid max-w-md grid-cols-2 gap-3">
            {[
              { icon: 'registrations', label: 'Registration control' },
              { icon: 'trophy', label: 'Draws & results' },
              { icon: 'scale', label: 'Weigh-in tracking' },
              { icon: 'users', label: 'Club network' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
                  <Icon name={f.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11px] font-semibold text-slate-300">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Systems operational
            </span>
            <span className="text-slate-700">·</span>
            <span>Secure manager access</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 text-lg font-black text-white shadow-lg">
              B
            </span>
            <div>
              <p className="text-lg font-black text-white">Bodymax</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">Events Platform</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white p-7 shadow-2xl shadow-slate-950/40 sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-inset ring-brand-100">
              <Icon name="shield" className="h-3 w-3" />
              Manager console
            </span>
            <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to manage your events, clubs and registrations.</p>

            <div className="mt-6 space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                <Icon name="alert" className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <Button type="submit" className="mt-6 w-full bg-gradient-to-r from-brand-600 to-indigo-600 shadow-lg shadow-brand-600/25 hover:from-brand-700 hover:to-indigo-700" disabled={loading}>
              {loading ? <Spinner className="h-4 w-4 border-white" /> : 'Sign in to console'}
            </Button>

            <p className="mt-5 text-center text-[11px] text-slate-400">
              Need access? Contact your promoter or account owner.
            </p>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-slate-400">
            <Link to="/" className="inline-flex items-center gap-1.5 transition hover:text-white">
              <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180" />
              Back to public site
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
