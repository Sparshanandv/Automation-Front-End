
import { useNavigate } from "react-router-dom";
import { Feature, FeatureStatus } from "../../types";
import { STATUS_LABELS, getNextStatus } from "../../utils/statusUtils";
import Button from "../Button/Button";
import { Icons } from "../Icons/Icons";
import DescriptionDisplay from "../common/DescriptionDisplay";

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
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className="min-h-[40px] text-sm font-semibold text-gray-900 line-clamp-2 break-words cursor-pointer group-hover:text-blue-600 transition-colors"
          onClick={() => navigate(`/features/${feature.id}`)}
        >
          {feature.title}
        </p>

        <div className="flex gap-1 shrink-0">
          {isCreated && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(feature)}
              className="text-gray-400 hover:text-blue-600"
            >
              <Icons.Edit className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(feature.id)}
            className="text-gray-400 hover:text-red-600"
          >
            <Icons.Trash className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 mb-2">
        <span className="text-[10px] font-bold text-gray-400 tracking-wider">
          #{feature.featureKey || feature.id.substring(0, 6)}
        </span>

        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            feature.type === "bug"
              ? "bg-red-100 text-red-700"
              : feature.type === "hotfix"
              ? "bg-orange-100 text-orange-700"
              : feature.type === "feature"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {feature.type || "task"}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-3 line-clamp-1">
          <DescriptionDisplay content={feature.description} />
      </p>

      <div className="flex items-center justify-between text-gray-500 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0 capitalize">
            {feature.createdBy?.email?.charAt(0) || "U"}
          </div>
          <span
            className="text-[11px] truncate"
            title={feature.createdBy?.email}
          >
            {feature.createdBy?.email?.split("@")[0] || "Unknown"}
          </span>
        </div>

        <span className="text-[10px] whitespace-nowrap">
          {new Date(feature.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {next ? (
        <button
          disabled={moving}
          onClick={() => onMoveNext(feature.id, next)}
          className="w-full text-xs bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-600 font-semibold py-2 px-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-100 hover:border-blue-600"
        >
          {moving ? "Moving…" : `Move to ${STATUS_LABELS[next]}`}
        </button>
      ) : (
        <div className="w-full text-center text-[11px] text-green-600 font-bold bg-green-50/50 py-1.5 rounded-lg border border-green-100">
          ✓ COMPLETED
        </div>
      )}
    </div>
  );
}