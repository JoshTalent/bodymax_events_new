import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { Card, CardBody } from '../../components/Card.jsx'
import { Loading } from '../../components/Loading.jsx'

function Stat({ label, value, to, tone }) {
  const accents = {
    brand: 'text-brand-700',
    green: 'text-brand-700',
    red: 'text-slate-900',
    blue: 'text-blue-700',
  }
  return (
    <Link to={to || '#'} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accents[tone] || accents.brand}`}>{value}</p>
    </Link>
  )
}

export default function PromoterDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api('/dashboard').then((d) => setData(d.dashboard)).catch(() => {})
  }, [])

  if (!data) return <Loading label="Loading dashboard..." />

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your boxing events</p>
        </div>
        <Link
          to="/app/events/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + New Event
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Events" value={data.totalEvents} to="/app/events" tone="brand" />
        <Stat label="Open Registrations" value={data.openEvents} to="/app/events" tone="green" />
        <Stat label="Clubs" value={data.clubCount} to="/app/clubs" tone="blue" />
        <Stat label="Boxers" value={data.boxerCount} to="/app/boxers" tone="purple" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Registrations" value={data.registrationCount} to="/app/registrations" tone="blue" />
        <Stat label="Pending Approvals" value={data.pendingRegistrations} to="/app/registrations" tone="red" />
        <Stat label="Successfully Weighed" value={data.weighedCount} to="/app/registrations" tone="green" />
      </div>

      <div className="mt-8">
        <Card>
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Recent Events</h3>
          </div>
          <CardBody className="p-0">
            {data.events.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500">No events yet. Create your first event to get started.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {data.events.map((ev) => (
                  <li key={ev._id}>
                    <Link to={`/app/events/${ev._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-900">{ev.name}</p>
                        <p className="text-sm text-slate-500">
                          {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : 'Date TBD'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ev.registrationOpen ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ev.registrationOpen ? 'Open' : ev.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
