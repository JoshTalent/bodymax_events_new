import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'

export default function PublicEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/public-events')
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-slate-900">Bodymax</Link>
          <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Events</h1>
        {loading ? (
          <Loading />
        ) : events.length === 0 ? (
          <p className="mt-8 text-slate-500">No public events right now.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <Link
                key={ev._id}
                to={`/events/${ev._id}`}
                className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">{ev.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {ev.venue}
                  {ev.location && ` · ${ev.location}`}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD'}
                </p>
                {ev.status === 'completed' && (
                  <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Completed</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
