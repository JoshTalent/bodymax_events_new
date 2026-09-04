import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/Button.jsx'
import { Card, CardBody } from '../../components/Card.jsx'
import { Loading, Empty } from '../../components/Loading.jsx'

export default function ClubList() {
  const [clubs, setClubs] = useState(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  const load = () => { api('/clubs').then((d) => setClubs(d.clubs)).catch(() => {}) }
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clubs</h1>
          <p className="text-sm text-slate-500">Boxing clubs participating in your events</p>
        </div>
        <Link
          to="/app/clubs/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Add Club
        </Link>
      </div>

      <Card>
        <CardBody className="p-0">
          {!clubs ? (
            <Loading />
          ) : clubs.length === 0 ? (
            <Empty title="No clubs yet" message="Add your first boxing club to get started." />
          ) : (
            <ul className="divide-y divide-slate-200">
              {clubs.map((club) => (
                <li key={club._id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <Link to={`/app/clubs/${club._id}`} className="min-w-0 flex-1 hover:opacity-80">
                    <p className="font-medium text-slate-900">{club.name}</p>
                    <p className="text-sm text-slate-500">
                      {club.contactName && `${club.contactName} · `}
                      {club.contactEmail || 'No email'}
                    </p>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">{club.boxerCount || 0} boxers</span>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/app/clubs/${club._id}`)}>Manage</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(club)}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}