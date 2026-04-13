import { Navigate, Outlet } from 'react-router-dom'
import { token } from '../utils/token'

export default function PublicLayout() {
  if (token.getAccess()) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
