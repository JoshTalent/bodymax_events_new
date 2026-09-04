import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { Loading } from './components/Loading.jsx'

import Home from './pages/public/Home.jsx'
import PublicEvents from './pages/public/PublicEvents.jsx'
import PublicEventDetail from './pages/public/PublicEventDetail.jsx'
import RolePortal from './pages/public/RolePortal.jsx'
import EventRegister from './pages/public/EventRegister.jsx'
import Login from './pages/Login.jsx'

import DashboardLayout from './pages/DashboardLayout.jsx'
import PromoterDashboard from './pages/promoter/Dashboard.jsx'
import EventList from './pages/promoter/EventList.jsx'
import EventCreate from './pages/promoter/EventCreate.jsx'
import EventDetail from './pages/promoter/EventDetail.jsx'
import Draws from './pages/promoter/Draws.jsx'
import Bouts from './pages/promoter/Bouts.jsx'
import Results from './pages/promoter/Results.jsx'
import ClubList from './pages/promoter/ClubList.jsx'
import ClubDetail from './pages/promoter/ClubDetail.jsx'
import ClubCreate from './pages/promoter/ClubCreate.jsx'
import BoxerList from './pages/promoter/BoxerList.jsx'
import Registrations from './pages/promoter/Registrations.jsx'

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
  if (user) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<PublicEvents />} />
      <Route path="/events/:id" element={<PublicEventDetail />} />
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
        <Route path="events/:id/bouts" element={<ProtectedRoute roles={['promoter']}><Bouts /></ProtectedRoute>} />
        <Route path="events/:id/results" element={<ProtectedRoute roles={['promoter']}><Results /></ProtectedRoute>} />

        <Route path="clubs" element={<ProtectedRoute roles={['promoter']}><ClubList /></ProtectedRoute>} />
        <Route path="clubs/new" element={<ProtectedRoute roles={['promoter']}><ClubCreate /></ProtectedRoute>} />
        <Route path="clubs/:id" element={<ProtectedRoute roles={['promoter']}><ClubDetail /></ProtectedRoute>} />

        <Route path="boxers" element={<ProtectedRoute roles={['promoter']}><BoxerList /></ProtectedRoute>} />
        <Route path="registrations" element={<ProtectedRoute roles={['promoter','official']}><Registrations /></ProtectedRoute>} />

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
