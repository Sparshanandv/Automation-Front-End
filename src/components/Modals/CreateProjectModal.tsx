import React, { useState } from 'react'
import Button from '../Button/Button'
import Input from '../Input/Input'
import RichTextEditor from '../common/RichTextEditor'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description: string; githubToken: string }) => void
}

export default function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [githubToken, setGithubToken] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name, description, githubToken })
    setName('')
    setDescription('')
    setGithubToken('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Input
              label="Project Name"
              placeholder="e.g. E-Commerce App"
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Brief description of the project"
            />
          </div>
          <div className="mb-6">
            <Input
              label="GitHub Token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Personal access token with <span className="font-medium">repo</span> scope. Used for all GitHub operations in this project.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !githubToken.trim()}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
