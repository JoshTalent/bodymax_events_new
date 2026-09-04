import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Card, CardBody } from '../../components/Card.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'
import { StatusBadge } from '../../components/Badge.jsx'

export default function EventList() {
  const [events, setEvents] = useState(null)

  useEffect(() => {
    api('/events').then((d) => setEvents(d.events)).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="text-sm text-slate-500">Manage your boxing tournaments</p>
        </div>
        <Link
          to="/app/events/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + New Event
        </Link>
      </div>

      <Card>
        <CardBody className="p-0">
          {!events ? (
            <Loading />
          ) : events.length === 0 ? (
            <Empty title="No events yet" message="Create your first boxing event to get started." />
          ) : (
            <ul className="divide-y divide-slate-200">
              {events.map((ev) => (
                <li key={ev._id}>
                  <Link to={`/app/events/${ev._id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{ev.name}</p>
                      <p className="text-sm text-slate-500">
                        {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : 'Date TBD'}
                        {' · '}
                        {ev.registrationCount} registrations
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {ev.registrationOpen && (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Registration Open</span>
                      )}
                      <StatusBadge status={ev.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
