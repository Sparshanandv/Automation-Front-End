import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Feature, FeatureStatus, StatusHistoryEntry } from '../../types'
import { featureService } from '../../services/feature.service'
import { STATUS_ORDER, STATUS_LABELS, getNextStatus } from '../../utils/statusUtils'
import Spinner from '../../components/Spinner/Spinner'
import Alert from '../../components/Alert/Alert'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [feature, setFeature] = useState<Feature | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    if (!id) return
    featureService.getById(id)
      .then(setFeature)
      .catch(() => setError('Failed to load task'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAdvance() {
    if (!feature) return
    const next = getNextStatus(feature.status)
    if (!next) return
    setAdvancing(true)
    try {
      const updated = await featureService.updateStatus(feature.id, next)
      setFeature(updated)
    } catch {
      setError('Failed to update status')
    } finally {
      setAdvancing(false)
    }
  }

  const currentIndex = feature ? STATUS_ORDER.indexOf(feature.status) : -1

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/features')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1"
        >
          ← Back to Board
        </button>

        {loading && <Spinner />}
        {error && <Alert message={error} />}

        {feature && (
          <>
            {/* Title + status */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-xl font-bold text-gray-900">{feature.title}</h1>
                <span className="shrink-0 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {STATUS_LABELS[feature.status]}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{feature.description}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Acceptance Criteria</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{feature.criteria}</p>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Status Timeline</p>
              <div className="flex items-center gap-0">
                {STATUS_ORDER.map((status, index) => {
                  const isPast    = index < currentIndex
                  const isCurrent = index === currentIndex
                  const isLast    = index === STATUS_ORDER.length - 1

                  return (
                    <div key={status} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            isPast    ? 'bg-green-500 border-green-500 text-white'
                            : isCurrent ? 'bg-blue-600 border-blue-600 text-white scale-110'
                            : 'bg-white border-gray-300 text-gray-400'
                          }`}
                        >
                          {isPast ? '✓' : index + 1}
                        </div>
                        <span
                          className={`text-center leading-tight whitespace-nowrap text-[10px] ${
                            isCurrent ? 'text-blue-600 font-semibold'
                            : isPast  ? 'text-green-600'
                            : 'text-gray-400'
                          }`}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className={`flex-1 h-0.5 mx-1 mb-4 ${
                            isPast ? 'bg-green-400' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Status History */}
            {feature.statusHistory?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Status History</p>
                <div className="flex flex-col gap-3">
                  {[...feature.statusHistory].reverse().map((entry: StatusHistoryEntry, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-800">
                            {STATUS_LABELS[entry.status]}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">
                            {formatDate(entry.changedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">by {entry.changedBy.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advance button */}
            {getNextStatus(feature.status) && (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {advancing
                  ? 'Advancing…'
                  : `Advance to ${STATUS_LABELS[getNextStatus(feature.status) as FeatureStatus]}`}
              </button>
            )}

            {!getNextStatus(feature.status) && (
              <div className="text-center py-3 text-green-600 font-semibold text-sm">
                ✓ This task is complete
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
