import { useEffect, useState } from 'react'
import api from '../../utils/axios'
import PageWrapper from '../../components/PageWrapper/PageWrapper'
import Alert from '../../components/Alert/Alert'
import Spinner from '../../components/Spinner/Spinner'
import Badge from '../../components/Badge/Badge'

interface Feature {
  name: string
  status: string
}

interface Summary {
  message: string
  user: { sub: string; email: string }
  features: Feature[]
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<Summary>('/demo/summary')
      .then((res) => setSummary(res.data))
      .catch(() => setError('Failed to load summary'))
  }, [])

  return (
    <PageWrapper>
      {error && <Alert message={error} className="mb-6" />}
      {!summary && !error && <Spinner />}

      {summary && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900">
              Welcome back, <span className="text-blue-600">{summary.user.email}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">{summary.message}</p>
          </div>

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Platform Features
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary.features.map((f) => (
              <div
                key={f.name}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-gray-800">{f.name}</span>
                <Badge
                  label={f.status}
                  variant={f.status === 'available' ? 'success' : 'warning'}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </PageWrapper>
  )
}
