import { useState } from 'react'
import { Feature, FeatureStatus } from '../../types'
import { STATUS_ORDER, NEXT_STATUS } from '../../utils/statusUtils'
import KanbanColumn from './KanbanColumn'
import { featureService } from '../../services/feature.service'

interface Props {
  features: Feature[]
  onUpdate: (updated: Feature) => void
}

export default function KanbanBoard({ features, onUpdate }: Props) {
  const [dragging, setDragging] = useState<Feature | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)

  function handleDragStart(feature: Feature) {
    setDragging(feature)
  }

  function handleDragOver(e: React.DragEvent, columnStatus: FeatureStatus) {
    // Only allow drop onto the immediate next status column
    if (dragging && NEXT_STATUS[dragging.status] === columnStatus) {
      e.preventDefault()
    }
  }

  async function handleDrop(columnStatus: FeatureStatus) {
    if (!dragging) return
    if (NEXT_STATUS[dragging.status] !== columnStatus) return
    await moveFeature(dragging.id, columnStatus)
    setDragging(null)
  }

  async function moveFeature(id: string, nextStatus: FeatureStatus) {
    setMovingId(id)
    try {
      const updated = await featureService.updateStatus(id, nextStatus)
      onUpdate(updated)
    } catch {
      // status update failed — no change
    } finally {
      setMovingId(null)
    }
  }

  const byStatus = (status: FeatureStatus) =>
    features.filter((f) => f.status === status)

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-180px)]">
      {STATUS_ORDER.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          features={byStatus(status)}
          isDropTarget={dragging ? NEXT_STATUS[dragging.status] === status : false}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onMoveNext={moveFeature}
          movingId={movingId}
        />
      ))}
    </div>
  )
}
