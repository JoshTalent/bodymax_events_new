import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { Icon } from '../../components/Icons.jsx'
import { cn } from '../../utils/cn.js'

function initials(name = '') {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'CB'
}

export default function ClubList() {
  const [clubs, setClubs] = useState(null)
  const [search, setSearch] = useState('')
  const { toast } = useToast()
  const navigate = useNavigate()

  const load = () => {
    api('/clubs').then((d) => setClubs(d.clubs)).catch(() => {})
  }
  useEffect(load, [])

  const handleDelete = async (club) => {
    if (!window.confirm(`Delete club "${club.name}" and its login account? This cannot be undone.`)) return
    try {
      await api(`/clubs?clubId=${club._id}`, { method: 'DELETE' })
      toast('Club deleted')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const filtered = useMemo(() => {
    const list = clubs || []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.contactName || '').toLowerCase().includes(q) ||
        (c.contactEmail || '').toLowerCase().includes(q)
    )
  }, [clubs, search])

  const totalBoxers = (clubs || []).reduce((s, c) => s + (c.boxerCount || 0), 0)

  return (
    <div>
      <PageHeader
        eyebrow="Network"
        title="Clubs"
        description="The boxing clubs participating in your events, their rosters and contacts."
        actions={
          <Link
            to="/app/clubs/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition hover:from-brand-700 hover:to-indigo-700"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add Club
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <div className="console-card flex items-center gap-3 px-4 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon name="clubs" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Clubs</p>
              <p className="text-base font-black leading-none text-slate-900">{clubs ? clubs.length : '—'}</p>
            </div>
          </div>
          <div className="console-card flex items-center gap-3 px-4 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Icon name="boxers" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Boxers</p>
              <p className="text-base font-black leading-none text-slate-900">{clubs ? totalBoxers : '—'}</p>
            </div>
          </div>
        </div>
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-500/10 sm:max-w-xs">
          <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs or contacts..."
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {!clubs ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="console-card">
          <Empty
            title={clubs.length === 0 ? 'No clubs yet' : 'No matching clubs'}
            message={clubs.length === 0 ? 'Add your first boxing club to get started.' : 'Try a different search term.'}
            action={
              clubs.length === 0 ? (
                <Link to="/app/clubs/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white">
                  Add club
                </Link>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((club, i) => (
            <article
              key={club._id}
              className={cn(
                'console-card animate-rise group overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_45px_-28px_rgba(15,23,42,0.4)]',
                i < 3 ? `delay-${i + 1}` : 'delay-2'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <Link to={`/app/clubs/${club._id}`} className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-[11px] font-black text-white shadow-sm">
                    {initials(club.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-slate-900 group-hover:text-brand-700">{club.name}</span>
                    <span className="block truncate text-[11px] text-slate-500">{club.contactName || 'No contact person'}</span>
                  </span>
                </Link>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  <Icon name="boxers" className="h-3 w-3" />
                  {club.boxerCount || 0}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px]">
                <p className="flex items-center gap-1.5 text-slate-600">
                  <Icon name="mail" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{club.contactEmail || 'No email on file'}</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-600">
                  <Icon name="flag" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{club.address || 'No address on file'}</span>
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                <Link to={`/app/clubs/${club._id}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-800">
                  Manage club
                  <Icon name="arrowUpRight" className="h-3.5 w-3.5" />
                </Link>
                <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => handleDelete(club)}>
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
