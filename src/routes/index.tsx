import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import PrivateLayout from '../layouts/PrivateLayout'
import AuthPage from '../pages/auth/AuthPage'
import DashboardPage from '../pages/dashboard/DashboardPage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — redirect to /dashboard if already logged in */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<AuthPage />} />
      </Route>

      {/* Private routes — redirect to /login if not authenticated */}
      <Route element={<PrivateLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
