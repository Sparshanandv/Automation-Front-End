import React, { useState } from 'react'
import Alert from '../Alert/Alert'
import Button from '../Button/Button'
import Input from '../Input/Input'

interface AddRepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { repo_name: string; branch: string; purpose: string; createNew: boolean; description?: string; isPrivate?: boolean }) => Promise<void>
}

export default function AddRepositoryModal({ isOpen, onClose, onSubmit }: AddRepositoryModalProps) {
  const [createNew, setCreateNew] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
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
      await onSubmit({ 
        repo_name: repoName, 
        branch, 
        purpose, 
        createNew, 
        description: createNew ? description : undefined, 
        isPrivate: createNew ? isPrivate : undefined 
      })
      setRepoName('')
      setDescription('')
      setIsPrivate(false)
      setBranch('main')
      setPurpose('FE')
      setCreateNew(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add repository')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">{createNew ? 'Create New Repository' : 'Link GitHub Repository'}</h2>
        
        {error && <Alert message={error} className="mb-4" />}

        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button 
            type="button"
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!createNew ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setCreateNew(false)}
          >
            Use Existing
          </button>
          <button 
            type="button"
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${createNew ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setCreateNew(true)}
          >
            Create New
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Input
              label={createNew ? 'Repository Name (Short)' : 'Repository Name (owner/repo)'}
              placeholder={createNew ? 'e.g. awesome-project' : 'e.g. facebook/react'}
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              required
            />
            {!createNew && <p className="text-xs text-gray-500 mt-1">Must be accessible by the configured GITHUB_TOKEN.</p>}
          </div>

          {createNew && (
            <>
              <div className="mb-4">
                <Input
                  label="Description"
                  placeholder="A short description of this repository"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Make repository Private
                </label>
              </div>
            </>
          )}
          
          <div className="mb-4">
            <Input
              label="Target Branch"
              placeholder="e.g. main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            />
            {createNew && <p className="text-xs text-gray-500 mt-1">GitHub generates `main` by default. We automatically create this branch if it differs.</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-colors"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="FE">Frontend (FE)</option>
              <option value="BE">Backend (BE)</option>
              <option value="Infra">Infrastructure (Infra)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={!repoName.trim() || !branch.trim()}
            >
              {createNew ? 'Create & Link' : 'Link Repository'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
