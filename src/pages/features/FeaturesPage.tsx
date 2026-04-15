import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Feature, Project } from "../../types";
import { featureService } from "../../services/feature.service";
import api from "../../utils/axios";
import { stripHtml } from "../../utils/stringUtils";
import KanbanBoard from "../../components/kanban/KanbanBoard";
import CreateFeatureModal from "../../components/modals/CreateFeatureModal";
import Spinner from "../../components/Spinner/Spinner";
import Alert from "../../components/Alert/Alert";

export default function FeaturesPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? undefined;

  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectKey, setProjectKey] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const featuresData = await featureService.listAll(projectId);
        setFeatures(featuresData);

        if (projectId) {
          const res = await api.get<Project>(`/projects/${projectId}`);
          setProjectName(res.data.name);
          setProjectDescription(res.data.description || "");
          setProjectKey(res.data.projectKey || "");
        }
      } catch (err: any) {
        setError("Failed to load details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  function handleCreate(feature: Feature) {
    setFeatures((prev) => [feature, ...prev]);
  }

  function handleUpdate(updated: Feature) {
    setFeatures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
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
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 leading-none">
                {projectName ? `${projectName}` : "Task Board"}
              </h1>
              {projectKey && (
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded tracking-wider">
                  {projectKey}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                {features.length} task{features.length !== 1 ? "s" : ""}
              </p>
              {projectDescription && (
                <p className="text-[11px] text-gray-400 truncate max-w-md border-l border-gray-200 pl-3">
                  {stripHtml(projectDescription)}
                </p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
          <KanbanBoard features={features} onUpdate={handleUpdate} />
        )}
      </div>

      {showModal && (
        <CreateFeatureModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          projectId={projectId}
        />
      )}
    </div>
  );
}
