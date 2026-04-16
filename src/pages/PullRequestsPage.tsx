import { useEffect, useState } from 'react'
import { prService } from '../services/pr.service'
import { PullRequest } from '../types'
import Spinner from '../components/Spinner/Spinner'
import Alert from '../components/Alert/Alert'

export default function PullRequestsPage() {
  const [prs, setPrs] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    prService.getAllPullRequests()
      .then(setPrs)
      .catch(() => setError('Failed to load pull requests'))
      .finally(() => setLoading(false))
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700'
      case 'merged': return 'bg-purple-100 text-purple-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Spinner size="lg" />
    </div>
  )

  if (error) return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Alert variant="error" message={error} />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Pull Requests</h1>

      {prs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <p className="text-gray-500">No pull requests yet</p>
          <p className="text-sm text-gray-400 mt-2">Generate code for a feature to create a PR</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {prs.map((pr, index) => (
            <div
              key={pr._id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                index !== prs.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{pr.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(pr.status)}`}>
                      {pr.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="font-mono">#{pr.pr_number}</span>
                    <span>{pr.repository.owner}/{pr.repository.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">{pr.branch_name}</p>
                </div>
                <a
                  href={pr.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  View on GitHub
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
