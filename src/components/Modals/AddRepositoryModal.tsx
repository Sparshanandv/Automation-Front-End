import React, { useState } from 'react'
import Alert from '../Alert/Alert'

interface AddRepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { repo_name: string; branch: string; purpose: string }) => Promise<void>
}

export default function AddRepositoryModal({ isOpen, onClose, onSubmit }: AddRepositoryModalProps) {
  const [repoName, setRepoName] = useState('')
  const [branch, setBranch] = useState('main')
  const [purpose, setPurpose] = useState('FE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoName.trim() || !branch.trim()) return

    setLoading(true)
    setError('')
    try {
      await onSubmit({ repo_name: repoName, branch, purpose })
      setRepoName('')
      setBranch('main')
      setPurpose('FE')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add repository')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Link GitHub Repository</h2>
        
        {error && <Alert message={error} className="mb-4" />}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Repository Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. facebook/react"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must be accessible by the configured GITHUB_TOKEN.</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="FE">Frontend (FE)</option>
              <option value="BE">Backend (BE)</option>
              <option value="Infra">Infrastructure (Infra)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !repoName.trim() || !branch.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? 'Adding...' : 'Add Repository'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
