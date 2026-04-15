import { useNavigate } from "react-router-dom";
import { Feature, FeatureStatus } from "../../types";
import { STATUS_LABELS, getNextStatus } from "../../utils/statusUtils";
import Button from "../Button/Button";
import { Icons } from "../Icons/Icons";

interface Props {
  feature: Feature;
  onDragStart: (feature: Feature) => void;
  onMoveNext: (id: string, nextStatus: FeatureStatus) => void;
  moving: boolean;
  onDelete: (id: string) => void;
  onEdit?: (feature: Feature) => void;
}

export default function FeatureCard({
  feature,
  onDragStart,
  onMoveNext,
  moving,
  onDelete,
  onEdit,
}: Props) {
  const navigate = useNavigate();
  const next = getNextStatus(feature.status);
  const isCreated = feature.status === "CREATED";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(feature)}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <p
          className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
          onClick={() => navigate(`/features/${feature.id}`)}
        >
          {feature.title}
        </p>
        <div className="flex gap-1">
          {isCreated && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(feature)}
              className="text-gray-400 hover:text-blue-600"
              title="Edit Task"
            >
              <Icons.Edit className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(feature.id)}
            className="text-gray-400 hover:text-red-600"
            title="Delete Task"
          >
            <Icons.Trash className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3 line-clamp-1">
        {feature.description}
      </p>

      {next && (
        <button
          disabled={moving}
          onClick={() => onMoveNext(feature.id, next)}
          className="w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-1.5 px-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {moving ? "Moving…" : `→ ${STATUS_LABELS[next]}`}
        </button>
      )}

      {!next && (
        <span className="block text-center text-xs text-green-600 font-medium py-1.5">
          ✓ Complete
        </span>
      )}
    </div>
  );
}
