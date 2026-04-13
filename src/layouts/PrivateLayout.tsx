import { Navigate, Outlet } from 'react-router-dom'
import { token } from '../utils/token'
import Navbar from '../components/Navbar/Navbar'

export default function PrivateLayout() {
  if (!token.getAccess()) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}
