import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Feature } from "../../types";
import { featureService } from "../../services/feature.service";
import KanbanBoard from "../../components/kanban/KanbanBoard";
import CreateFeatureModal from "../../components/modals/CreateFeatureModal";
import Spinner from "../../components/Spinner/Spinner";
import Alert from "../../components/Alert/Alert";

export default function FeaturesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("projectId") ?? undefined;

  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [featureToEdit, setFeatureToEdit] = useState<Feature | undefined>();

  useEffect(() => {
    featureService
      .listAll(projectId)
      .then(setFeatures)
      .catch(() => setError("Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [projectId]);

  function handleCreate(feature: Feature) {
    setFeatures((prev) => [feature, ...prev]);
  }

  function handleUpdate(updated: Feature) {
    setFeatures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }

  function handleDelete(id: string) {
    setFeatures((prev) => prev.filter((f) => f.id !== id));
  }

  function handleOpenEditModal(feature: Feature) {
    setFeatureToEdit(feature);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setFeatureToEdit(undefined);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          {projectId && (
            <Link
              to={`/projects/${projectId}`}
              className="text-xl font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-6 transition-colors"
            >
              &larr;
            </Link>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900">Task Board</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {features.length} task{features.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setFeatureToEdit(undefined);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          + New Task
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        {loading && <Spinner />}
        {error && <Alert message={error} />}
        {!loading && !error && (
          <KanbanBoard
            features={features}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onEdit={handleOpenEditModal}
          />
        )}
      </div>

      {showModal && (
        <CreateFeatureModal
          onClose={handleCloseModal}
          onCreate={featureToEdit ? undefined : handleCreate}
          onUpdate={featureToEdit ? handleUpdate : undefined}
          projectId={projectId}
          featureToEdit={featureToEdit}
        />
      )}
    </div>
  );
}
