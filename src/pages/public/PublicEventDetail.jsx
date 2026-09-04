import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../utils/api.js'
import { Loading } from '../../components/Loading.jsx'

export default function PublicEventDetail() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api(`/public-events?id=${id}`)
      .then((d) => setEvent(d.event))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-slate-900">Bodymax</Link>
          <Link to="/events" className="text-sm font-medium text-brand-600 hover:text-brand-700">All events</Link>
        </div>
      </header>

      {!event ? (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-slate-500">Event not found or is not public.</p>
          <Link to="/events" className="mt-4 inline-block text-brand-600 hover:underline">← Back to events</Link>
        </div>
      ) : (
        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">{event.name}</h1>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">Venue</p>
                <p className="text-slate-900">{event.venue || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Location</p>
                <p className="text-slate-900">{event.location || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Date</p>
                <p className="text-slate-900">
                  {event.eventDate ? new Date(event.eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}
                </p>
              </div>
            </div>

            {event.description && (
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-500">About</p>
                <p className="mt-1 whitespace-pre-line text-slate-700">{event.description}</p>
              </div>
            )}

            {(event.weightCategories?.length > 0 || event.ageCategories?.length > 0) && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {event.weightCategories?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Weight Categories</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {event.weightCategories.map((c) => (
                        <span key={c} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {event.ageCategories?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Age Categories</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {event.ageCategories.map((c) => (
                        <span key={c} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  )
}
