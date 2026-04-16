import { useState } from "react";
import { Feature, FeatureStatus } from "../../types";
import { STATUS_ORDER, NEXT_STATUS, validateFeatureMove } from "../../utils/statusUtils";
import StatusBlockedModal from "../Modals/StatusBlockedModal";
import KanbanColumn from "./KanbanColumn";
import { featureService } from "../../services/feature.service";

interface Props {
  features: Feature[];
  onUpdate: (updated: Feature) => void;
  onDelete: (id: string) => void;
  onEdit?: (feature: Feature) => void;
}

export default function KanbanBoard({
  features,
  onUpdate,
  onDelete,
  onEdit,
}: Props) {
  const [dragging, setDragging] = useState<Feature | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);

  function handleDragStart(feature: Feature) {
    setDragging(feature);
  }

  function handleDragOver(e: React.DragEvent, columnStatus: FeatureStatus) {
    // Only allow drop onto the immediate next status column
    if (dragging && NEXT_STATUS[dragging.status] === columnStatus) {
      e.preventDefault();
    }
  }

  async function handleDrop(columnStatus: FeatureStatus) {
    if (!dragging) return;
    if (NEXT_STATUS[dragging.status] !== columnStatus) return;
    await moveFeature(dragging.id, columnStatus);
    setDragging(null);
  }

  async function moveFeature(id: string, nextStatus: FeatureStatus) {
    const featureToMove = features.find((f) => f.id === id);
    if (!featureToMove) return;

    const validation = validateFeatureMove(featureToMove, nextStatus);
    if (!validation.isValid) {
      setBlockedMsg(validation.errorMsg || `Cannot move task to ${nextStatus}.`);
      return;
    }

    setMovingId(id);
    try {
      const updated = await featureService.updateStatus(id, nextStatus);
      onUpdate(updated);
    } catch {
      // status update failed — no change
    } finally {
      setMovingId(null);
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete this task?`)) {
      try {
        await featureService.deleteFeature(id);
        onDelete(id);
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  const byStatus = (status: FeatureStatus) =>
    features.filter((f) => f.status === status);

  return (
    <>
    <StatusBlockedModal
      isOpen={!!blockedMsg}
      message={blockedMsg ?? ''}
      onClose={() => setBlockedMsg(null)}
    />
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-180px)]">
      {STATUS_ORDER.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          features={byStatus(status)}
          isDropTarget={
            dragging ? NEXT_STATUS[dragging.status] === status : false
          }
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onMoveNext={moveFeature}
          movingId={movingId}
          onDelete={handleDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
    </>
  );
}
