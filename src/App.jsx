import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { Loading } from './components/Loading.jsx'


import Home from './pages/public/Home.jsx'
import PublicEvents from './pages/public/PublicEvents.jsx'
import PublicEventDetail from './pages/public/PublicEventDetail.jsx'
import RolePortal from './pages/public/RolePortal.jsx'
import EventRegister from './pages/public/EventRegister.jsx'
import PublicDraws from './pages/public/PublicDraws.jsx'
import Login from './pages/Login.jsx'

import DashboardLayout from './pages/DashboardLayout.jsx'
import PromoterDashboard from './pages/promoter/Dashboard.jsx'
import EventList from './pages/promoter/EventList.jsx'
import EventCreate from './pages/promoter/EventCreate.jsx'
import EventDetail from './pages/promoter/EventDetail.jsx'
import Draws from './pages/promoter/Draws.jsx'
import Results from './pages/promoter/Results.jsx'
import Registrations from './pages/promoter/Registrations.jsx'
import Users from './pages/promoter/Users.jsx'

import Settings from './pages/Settings.jsx'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (user) return <Navigate to="/app" replace />
  return <Login />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<PublicEvents />} />
      <Route path="/events/:id" element={<PublicEventDetail />} />
      <Route path="/draws/:token" element={<PublicDraws />} />
      <Route path="/portal/:token" element={<RolePortal />} />
      <Route path="/register/:token" element={<EventRegister />} />
      <Route path="/login" element={<LoginRoute />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleHome />} />

        <Route path="events" element={<EventList />} />
        <Route path="events/new" element={<ProtectedRoute roles={['promoter']}><EventCreate /></ProtectedRoute>} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/:id/draws" element={<ProtectedRoute roles={['promoter']}><Draws /></ProtectedRoute>} />
        <Route path="events/:id/results" element={<ProtectedRoute roles={['promoter']}><Results /></ProtectedRoute>} />

        <Route path="clubs/*" element={<Navigate to="/app/events" replace />} />
        <Route path="boxers/*" element={<Navigate to="/app/events" replace />} />

        <Route path="registrations" element={<ProtectedRoute roles={['promoter','official']}><Registrations /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['promoter']}><Users /></ProtectedRoute>} />

        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RoleHome() {
  const { user } = useAuth()
  if (user.role === 'promoter') return <PromoterDashboard />
  return <PromoterDashboard />
}
