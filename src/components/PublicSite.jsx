import { Link } from 'react-router-dom'
import { cn } from '../utils/cn.js'

export function PublicNavbar({ active }) {
  const link = (to, label, key) => (
    <Link
      to={to}
      className={cn(
        'rounded-lg px-3 py-2 text-sm font-medium transition',
        active === key ? 'text-white' : 'text-slate-300 hover:text-white'
      )}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
          <span className="text-lg font-black tracking-tight text-white">Bodymax</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {link('/', 'Home', 'home')}
          {link('/events', 'Events', 'events')}
        </nav>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          <div className="text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
              <span className="text-lg font-black tracking-tight text-white">Bodymax</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500">Live event management for championship boxing — draws, results and everything between.</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Powered by Bodymax · Live event management
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Explore</p>
              <ul className="mt-3 space-y-2.5">
                <li><Link to="/" className="text-slate-500 transition hover:text-white">Home</Link></li>
                <li><Link to="/events" className="text-slate-500 transition hover:text-white">Events</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Promoters</p>
              <ul className="mt-3 space-y-2.5">
                <li><Link to="/app" className="text-slate-500 transition hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Bodymax Tournament Management
        </div>
      </div>
    </footer>
  )
}