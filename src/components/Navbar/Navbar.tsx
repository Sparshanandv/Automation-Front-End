import { useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth.service'

export default function Navbar() {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <span className="text-base font-bold text-gray-900">AI SDLC Automation</span>
      <button
        onClick={handleLogout}
        className="px-4 py-1.5 text-sm font-semibold text-red-600 border border-red-200
          rounded-lg hover:bg-red-50 transition-colors"
      >
        Logout
      </button>
    </nav>
  )
}
