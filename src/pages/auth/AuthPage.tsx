import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from '../../services/auth.service'
import Input from '../../components/Input/Input'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import Alert from '../../components/Alert/Alert'
import { useToast } from '../../context/ToastContext'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/dashboard')
      } else {
        await signup(email, password)
        toast('Account created successfully! Welcome aboard.', 'success')
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(msg || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI SDLC Automation</h1>
          <p className="text-sm text-gray-500 mt-1">Automate your software development lifecycle</p>
        </div>

        <Card padding="lg">
          {/* Tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all
                  ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {m === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Inline error — visible, inside the card */}
          {error && <Alert message={error} variant="error" className="mb-4" />}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <Button type="submit" loading={loading} fullWidth className="mt-2">
              {mode === 'login' ? 'Login' : 'Create Account'}
            </Button>
          </form>
        </Card>

      </div>
    </div>
  )
}
