import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Home() {
  const [events, setEvents] = useState([])
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api('/public-events').then((d) => setEvents(d.events || [])).catch(() => {})
  }, [])

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-bold text-slate-900">Bodymax</span>
          <nav className="flex items-center gap-4">
            <Link to="/events" className="text-sm font-medium text-slate-600 hover:text-slate-900">Events</Link>
            {user ? (
              <>
                <Link to="/app" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section className="bg-slate-900 py-20 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Championship Boxing, Organized.</h1>
          <p className="mt-4 text-lg text-slate-300">
            Follow upcoming tournaments, view fighters, draws and results — all in one place.
          </p>
          <Link
            to="/events"
            className="mt-8 inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            View Upcoming Events
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.length === 0 && (
            <p className="col-span-full text-slate-500">No public events yet.</p>
          )}
          {events.map((ev) => (
            <Link
              key={ev._id}
              to={`/events/${ev._id}`}
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">{ev.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {ev.venue}
                {ev.location && ` · ${ev.location}`}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : 'Date TBD'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Bodymax Tournament Management
        </div>
      </footer>
    </div>
  )
}
