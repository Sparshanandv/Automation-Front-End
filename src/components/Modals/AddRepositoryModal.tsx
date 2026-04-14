import React, { useState } from 'react'
import { Icons } from '../Icons/Icons'
import Alert from '../Alert/Alert'
import Button from '../Button/Button'
import Input from '../Input/Input'

interface AddRepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { repo_name: string; branch: string; purpose: string; createNew: boolean; description?: string; isPrivate?: boolean }) => Promise<void>
}

interface FormData {
  createNew: boolean
  repoName: string
  description: string
  isPrivate: boolean
  branch: string
  purpose: string
  loading: boolean
  error: string
}

const initialState: FormData = {
  createNew: false,
  repoName: '',
  description: '',
  isPrivate: false,
  branch: 'main',
  purpose: 'FE',
  loading: false,
  error: '',
}

const PURPOSE_OPTIONS = {
  FE: 'Frontend (FE)',
  BE: 'Backend (BE)',
  Infra: 'Infrastructure (Infra)',
}

export default function AddRepositoryModal({ isOpen, onClose, onSubmit }: AddRepositoryModalProps) {
  const [formData, setFormData] = useState<FormData>(initialState)

  if (!isOpen) return null

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.repoName.trim() || !formData.branch.trim()) return

    updateField('loading', true)
    updateField('error', '')
    try {
      await onSubmit({ 
        repo_name: formData.repoName, 
        branch: formData.branch, 
        purpose: formData.purpose, 
        createNew: formData.createNew, 
        description: formData.createNew ? formData.description : undefined, 
        isPrivate: formData.createNew ? formData.isPrivate : undefined 
      })
      setFormData(initialState)
    } catch (err: any) {
      updateField('error', err.response?.data?.message || 'Failed to add repository')
    } finally {
      updateField('loading', false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          {formData.createNew ? <Icons.Plus className="text-blue-600" /> : <Icons.Link className="text-blue-600" />}
          {formData.createNew ? 'Create New Repository' : 'Link GitHub Repository'}
        </h2>
        
        {formData.error && <Alert message={formData.error} className="mb-4" />}

        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button 
            type="button"
            className={`cursor-pointer flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!formData.createNew ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => updateField('createNew', false)}
          >
            Use Existing
          </button>
          <button 
            type="button"
            className={`cursor-pointer flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.createNew ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => updateField('createNew', true)}
          >
            Create New
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="relative">
              <Input
                label={formData.createNew ? 'Repository Name (Short)' : 'Repository Name (owner/repo)'}
                placeholder={formData.createNew ? 'e.g. awesome-project' : 'e.g. facebook/react'}
                value={formData.repoName}
                onChange={(e) => updateField('repoName', e.target.value)}
                required
                className="pl-9"
              />
              <div className="absolute left-3 top-[38px] text-gray-400">
                {formData.createNew ? <Icons.Folder size={18} /> : <Icons.GitHub size={18} />}
              </div>
            </div>
            {!formData.createNew && <p className="text-xs text-gray-500 mt-1">Must be accessible by the configured GITHUB_TOKEN.</p>}
          </div>

          {formData.createNew && (
            <>
              <div className="mb-4">
                <Input
                  label="Description"
                  placeholder="A short description of this repository"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  checked={formData.isPrivate}
                  onChange={(e) => updateField('isPrivate', e.target.checked)}
                />
                <label htmlFor="isPrivate" className="ml-2 flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  {formData.isPrivate ? <Icons.Lock className="text-amber-500" /> : <Icons.Unlock className="text-green-500" />}
                  Make repository Private
                </label>
              </div>
            </>
          )}
          
          <div className="mb-4 relative">
            <Input
              label="Target Branch"
              placeholder="e.g. main"
              value={formData.branch}
              onChange={(e) => updateField('branch', e.target.value)}
              required
              className="pl-9"
            />
            <div className="absolute left-3 top-[38px] text-gray-400">
              <Icons.Branch size={18} />
            </div>
            {formData.createNew && <p className="text-xs text-gray-500 mt-1">GitHub generates `main` by default. We automatically create this branch if it differs.</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-colors"
              value={formData.purpose}
              onChange={(e) => updateField('purpose', e.target.value)}
            >
              {Object.entries(PURPOSE_OPTIONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={formData.loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={formData.loading}
              disabled={!formData.repoName.trim() || !formData.branch.trim()}
            >
              {formData.createNew ? 'Create & Link' : 'Link Repository'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
