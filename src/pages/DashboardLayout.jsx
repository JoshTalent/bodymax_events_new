import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../utils/api.js'
import { cn } from '../utils/cn.js'
import { Icon } from '../components/Icons.jsx'
import { Logo } from '../components/Logo.jsx'

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'BM'
  )
}

function getPageMeta(pathname) {
  if (pathname === '/app') return { section: 'Overview', title: 'Dashboard' }
  if (pathname === '/app/events') return { section: 'Operations', title: 'Events' }
  if (pathname === '/app/events/new') return { section: 'Events', title: 'Create Event' }
  if (/^\/app\/events\/[^/]+\/draws/.test(pathname)) return { section: 'Events', title: 'Draw Control Room' }
  if (/^\/app\/events\/[^/]+\/results/.test(pathname)) return { section: 'Events', title: 'Results' }
  if (/^\/app\/events\/[^/]+/.test(pathname)) return { section: 'Events', title: 'Event Command Center' }
  if (pathname === '/app/registrations') return { section: 'Operations', title: 'Registrations' }
  if (pathname === '/app/users') return { section: 'Operations', title: 'Users' }
  if (pathname === '/app/settings') return { section: 'Account', title: 'Settings' }
  return { section: 'Console', title: 'Dashboard' }
}

function SidebarLink({ item, active, close }) {
  return (
    <Link
      to={item.to}
      onClick={close}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200',
        active
          ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
      )}
    >
      {active && (
        <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-400 to-indigo-500" />
      )}
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          active ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 group-hover:text-slate-300'
        )}
      >
        <Icon name={item.icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge > 0 && (
        <span
          className={cn(
            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
            active ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-200'
          )}
        >
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </Link>
  )
}

function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 via-blue-600 to-indigo-700 shadow-lg shadow-brand-900/40">
        <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white/20 blur-md" />
        <Logo className="h-6 w-6" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block text-[17px] font-black leading-none tracking-tight text-white">Bodymax</span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Events Platform</span>
        </span>
      )}
    </div>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [registrationCount, setRegistrationCount] = useState(null)
  const [navOpen, setNavOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const searchRef = useRef(null)
  const userMenuRef = useRef(null)

  const isPromoter = user?.role === 'promoter'
  const isOfficial = user?.role === 'official'
  const canManageUsers = user?.canManageUsers !== false

  useEffect(() => {
    api('/dashboard')
      .then((d) => setRegistrationCount(d.dashboard?.newRegistrationCount ?? 0))
      .catch(() => {})
  }, [location.pathname])

  useEffect(() => {
    const onSeen = () => setRegistrationCount(0)
    window.addEventListener('registrations-seen', onSeen)
    return () => window.removeEventListener('registrations-seen', onSeen)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setUserMenu(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    setNavOpen(false)
    setSearchOpen(false)
    setUserMenu(false)
  }, [location.pathname])

  const roleLabel = isPromoter ? 'Manager' : isOfficial ? 'Official' : 'Club'
  const consoleName = isPromoter ? 'Manager console' : isOfficial ? 'Officials console' : 'Club console'
  const meta = getPageMeta(location.pathname)

  const navSections = useMemo(() => {
    const sections = []
    sections.push({
      label: 'Workspace',
      items: [{ to: '/app', label: 'Dashboard', icon: 'dashboard', end: true }],
    })

    const ops = []
    ops.push({ to: '/app/events', label: isOfficial ? 'Events' : 'Events', icon: 'events' })
    if (isPromoter || isOfficial) {
      ops.push({
        to: '/app/registrations',
        label: isOfficial ? 'Records' : 'Registrations',
        icon: 'registrations',
        badge: registrationCount,
      })
    }
    if (isPromoter && canManageUsers) ops.push({ to: '/app/users', label: 'Users', icon: 'users' })
    sections.push({ label: isPromoter ? 'Operations' : 'Tournaments', items: ops })

    sections.push({ label: 'Account', items: [{ to: '/app/settings', label: 'Settings', icon: 'settings' }] })
    return sections
  }, [isPromoter, isOfficial, canManageUsers, registrationCount])

  const allItems = useMemo(() => navSections.flatMap((s) => s.items), [navSections])

  const mobileNavItems = useMemo(() => {
    const base = [{ to: '/app', label: 'Home', icon: 'dashboard', end: true }]
    if (isPromoter) {
      base.push({ to: '/app/events', label: 'Events', icon: 'events' })
      base.push({ to: '/app/registrations', label: 'Entries', icon: 'registrations' })
    } else {
      base.push({ to: '/app/events', label: 'Events', icon: 'events' })
      base.push({ to: '/app/registrations', label: 'Records', icon: 'registrations' })
    }
    base.push({ to: '/app/settings', label: 'Settings', icon: 'settings' })
    return base
  }, [isPromoter])

  const isActive = (path, end) => (end ? location.pathname === path : location.pathname.startsWith(path))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const searchResults = query.trim()
    ? allItems.filter((it) => it.label.toLowerCase().includes(query.trim().toLowerCase()))
    : allItems.slice(0, 6)

  const runSearch = (to) => {
    navigate(to)
    setQuery('')
    setSearchOpen(false)
  }

  const SidebarContent = ({ mobile = false, close }) => (
    <>
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
        <Link to="/app" onClick={close}>
          <BrandMark />
        </Link>
        {mobile && (
          <button
            onClick={close}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 text-[11px] font-black text-white">
              {initials(user?.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{user?.name || 'Bodymax'}</p>
              <p className="truncate text-[10px] font-medium text-slate-500">{consoleName}</p>
            </div>
            <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-600">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarLink
                  key={item.label}
                  item={item}
                  active={isActive(item.to, item.end)}
                  close={close}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-white/[0.06] p-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-600/20 via-indigo-600/10 to-transparent p-3.5 ring-1 ring-inset ring-white/10">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-brand-500/20 blur-xl" />
          <div className="relative">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-200">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Command center
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Everything synced. Your events are live and ready.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Systems operational
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app/settings"
            onClick={close}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-200 ring-1 ring-white/10">
              {initials(user?.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-slate-200">{user?.name}</span>
              <span className="block truncate text-[10px] text-slate-500">{user?.email}</span>
            </span>
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white"
          >
            <Icon name="logout" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="console-bg min-h-screen md:pl-[268px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[268px] flex-col bg-ink-900 md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-slate-200/80 bg-white/85 px-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-1">
          <button
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <Link to="/app" className="flex items-center gap-2">
            <Logo className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-black text-slate-900">Bodymax</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/app/registrations"
            className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Registrations"
          >
            <Icon name="bell" className="h-5 w-5" />
            {registrationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {registrationCount > 9 ? '9+' : registrationCount}
              </span>
            )}
          </Link>
          <button
            aria-label="Sign out"
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Icon name="logout" className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Desktop top bar */}
      <header className="sticky top-0 z-20 hidden h-[76px] items-center gap-4 border-b border-slate-200/70 bg-white/75 px-8 backdrop-blur-xl md:flex lg:px-10">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            <span>{meta.section}</span>
            <Icon name="chevronRight" className="h-3 w-3" />
            <span className="text-brand-600">{meta.title}</span>
          </div>
          <p className="mt-0.5 truncate text-[15px] font-bold text-slate-900">{meta.title}</p>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="relative">
            <div className="flex h-9 w-[290px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 transition focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10">
              <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchResults[0]) runSearch(searchResults[0].to)
                }}
                placeholder="Search the console..."
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400 lg:block">
                ⌘K
              </kbd>
            </div>
            {searchOpen && (
              <div className="animate-pop absolute right-0 top-11 w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/10">
                <p className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {query.trim() ? 'Results' : 'Quick navigation'}
                </p>
                {searchResults.length === 0 ? (
                  <p className="px-2.5 py-3 text-xs text-slate-500">No matches found.</p>
                ) : (
                  searchResults.map((item) => (
                    <button
                      key={item.label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => runSearch(item.to)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                        <Icon name={item.icon} className="h-4 w-4" />
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      <Icon name="arrowRight" className="h-3.5 w-3.5 text-slate-300" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <Link
            to="/app/registrations"
            title="New registrations"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <Icon name="bell" className="h-[18px] w-[18px]" />
            {registrationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {registrationCount > 9 ? '9+' : registrationCount}
              </span>
            )}
          </Link>

          <div className="h-6 w-px bg-slate-200" />

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenu((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl border border-transparent py-1 pl-1 pr-2 transition hover:border-slate-200 hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 text-[11px] font-bold text-white shadow-sm">
                {initials(user?.name)}
              </span>
              <span className="hidden text-left lg:block">
                <span className="block max-w-36 truncate text-xs font-bold text-slate-900">{user?.name}</span>
                <span className="block text-[10px] font-medium text-slate-500">{roleLabel}</span>
              </span>
              <Icon name="chevronDown" className={cn('h-3.5 w-3.5 text-slate-400 transition', userMenu && 'rotate-180')} />
            </button>

            {userMenu && (
              <div className="animate-pop absolute right-0 top-12 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                  <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-inset ring-brand-100">
                    <Icon name="shield" className="h-3 w-3" />
                    {roleLabel}
                  </span>
                </div>
                <div className="p-1.5">
                  <Link
                    to="/app/settings"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Icon name="settings" className="h-4 w-4" />
                    Account settings
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Icon name="globe" className="h-4 w-4" />
                    View public site
                  </Link>
                </div>
                <div className="border-t border-slate-100 p-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <Icon name="logout" className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile slide-in menu */}
      {navOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden" onClick={() => setNavOpen(false)} />
          <aside className="animate-pop fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-ink-900 shadow-2xl md:hidden">
            <SidebarContent mobile close={() => setNavOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="mx-auto w-full max-w-[1500px] px-4 py-5 pb-28 sm:px-6 md:px-8 md:py-8 lg:px-10 lg:py-9">
        <div key={location.pathname} className="animate-fade">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${mobileNavItems.length}, minmax(0, 1fr))` }}>
          {mobileNavItems.map((it) => {
            const active = isActive(it.to, it.end)
            return (
              <Link
                key={it.label}
                to={it.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition',
                  active ? 'text-brand-700' : 'text-slate-400 active:text-slate-700'
                )}
              >
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition', active && 'bg-brand-50')}>
                  <Icon name={it.icon} className="h-5 w-5" />
                </span>
                {it.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
