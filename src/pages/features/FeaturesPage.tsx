import { useEffect, useState } from 'react'
import { Feature } from '../../types'
import { featureService } from '../../services/feature.service'
import KanbanBoard from '../../components/kanban/KanbanBoard'
import CreateFeatureModal from '../../components/modals/CreateFeatureModal'
import Spinner from '../../components/Spinner/Spinner'
import Alert from '../../components/Alert/Alert'

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    featureService.listAll()
      .then(setFeatures)
      .catch(() => setError('Failed to load tasks'))
      .finally(() => setLoading(false))
  }, [])

  function handleCreate(feature: Feature) {
    setFeatures((prev) => [feature, ...prev])
  }

  function handleUpdate(updated: Feature) {
    setFeatures((prev) => prev.map((f) => f.id === updated.id ? updated : f))
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Task Board</h1>
          <p className="text-xs text-gray-400 mt-0.5">{features.length} task{features.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Task
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        {loading && <Spinner />}
        {error && <Alert message={error} />}
        {!loading && !error && (
          <KanbanBoard features={features} onUpdate={handleUpdate} />
        )}
      </div>

      {showModal && (
        <CreateFeatureModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
