import { useNavigate } from 'react-router-dom'
import { Feature, FeatureStatus } from '../../types'
import { STATUS_LABELS, getNextStatus } from '../../utils/statusUtils'

interface Props {
  feature: Feature
  onDragStart: (feature: Feature) => void
  onMoveNext: (id: string, nextStatus: FeatureStatus) => void
  moving: boolean
}

export default function FeatureCard({ feature, onDragStart, onMoveNext, moving }: Props) {
  const navigate = useNavigate()
  const next = getNextStatus(feature.status)

  return (
    <div
      draggable
      onDragStart={() => onDragStart(feature)}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <p
        className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
        onClick={() => navigate(`/features/${feature.id}`)}
      >
        {feature.title}
      </p>

      <p className="text-xs text-gray-400 mb-3 line-clamp-1">{feature.description}</p>

      {next && (
        <button
          disabled={moving}
          onClick={() => onMoveNext(feature.id, next)}
          className="w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-1.5 px-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {moving ? 'Moving…' : `→ ${STATUS_LABELS[next]}`}
        </button>
      )}

      {!next && (
        <span className="block text-center text-xs text-green-600 font-medium py-1.5">
          ✓ Complete
        </span>
      )}
    </div>
  )
}
