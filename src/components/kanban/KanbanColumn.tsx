import { Feature, FeatureStatus } from "../../types";
import { STATUS_LABELS } from "../../utils/statusUtils";
import FeatureCard from "./FeatureCard";

interface Props {
  status: FeatureStatus;
  features: Feature[];
  isDropTarget: boolean;
  onDragOver: (e: React.DragEvent, status: FeatureStatus) => void;
  onDrop: (status: FeatureStatus) => void;
  onDragStart: (feature: Feature) => void;
  onMoveNext: (id: string, nextStatus: FeatureStatus) => void;
  movingId: string | null;
  onDelete: (id: string) => void;
  onEdit?: (feature: Feature) => void;
}

const STATUS_COLORS: Record<FeatureStatus, string> = {
  CREATED: "border-t-gray-400",
  QA: "border-t-yellow-400",
  QA_APPROVED: "border-t-yellow-600",
  DEV: "border-t-blue-400",
  PLAN_APPROVED: "border-t-blue-600",
  CODE_GEN: "border-t-purple-500",
  PR_CREATED: "border-t-orange-400",
  DONE: "border-t-green-500",
};

export default function KanbanColumn({
  status,
  features,
  isDropTarget,
  onDragOver,
  onDrop,
  onDragStart,
  onMoveNext,
  movingId,
  onDelete,
  onEdit,
}: Props) {
  return (
    <div
      onDragOver={(e) => onDragOver(e, status)}
      onDrop={() => onDrop(status)}
      className={`flex-shrink-0 w-56 bg-gray-50 rounded-xl border-t-4 ${STATUS_COLORS[status]} transition-all ${
        isDropTarget ? "ring-2 ring-blue-400 bg-blue-50" : ""
      }`}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-medium">
          {features.length}
        </span>
      </div>

      {/* Cards */}
      <div className="px-2 pb-3 flex flex-col gap-2 min-h-24">
        {features.map((f) => (
          <FeatureCard
            key={f.id}
            feature={f}
            onDragStart={onDragStart}
            onMoveNext={onMoveNext}
            moving={movingId === f.id}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
