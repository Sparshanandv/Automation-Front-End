import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Feature,
  FeatureStatus,
  StatusHistoryEntry,
  TestCase,
} from "../../types";
import { featureService } from "../../services/feature.service";
import { qaService } from "../../services/qa.service";
import {
  STATUS_ORDER,
  STATUS_LABELS,
  getNextStatus,
  validateFeatureMove,
} from "../../utils/statusUtils";
import Spinner from "../../components/Spinner/Spinner";
import Alert from "../../components/Alert/Alert";
import QAPanel from "../../components/QA/QAPanel";
import DevPlanGenerator from "../../components/features/DevPlanGenerator";

import DescriptionDisplay from '../../components/common/DescriptionDisplay'
import StatusBlockedModal from '../../components/Modals/StatusBlockedModal'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [feature, setFeature] = useState<Feature | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [advancing, setAdvancing] = useState(false)
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null)
  const [testCases, setTestCases] = useState<TestCase[]>([])

  const fetchFeatureDetails = () =>{
    if (!id) return
    featureService.getById(id)
      .then(setFeature)
      .catch(() => setError("Failed to load task"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!id) return;
    fetchFeatureDetails();

    // Load test cases from localStorage
    const saved = localStorage.getItem(`test-cases-${id}`);
    if (saved) {
      try {
        setTestCases(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved test cases", e);
        setTestCases([]);
      }
    } else {
      setTestCases([]);
    }
  }, [id]);

  useEffect(() => {
    // Only save if we have test cases AND they were loaded for the current ID
    // We check if it's not empty, but we also need to be sure it's not the old feature's data.
    // By resetting to [] when ID changes (see above), we avoid most issues.
    if (id && testCases.length > 0) {
      localStorage.setItem(`test-cases-${id}`, JSON.stringify(testCases));
    }
  }, [id, testCases]);

  async function handleAdvance() {
    if (!feature) return;
    const next = getNextStatus(feature.status);
    if (!next) return;

    const validation = validateFeatureMove(feature, next);
    if (!validation.isValid) {
      setBlockedMsg(validation.errorMsg || `Cannot advance to ${next}.`);
      return;
    }

    setAdvancing(true);
    setError("");
    try {
      if (feature.status === 'CREATED') {
        const data = await qaService.generateTestCases(feature.id)

        const mappedTestCases = data.content.map(tc => ({
          ...tc,
          status: tc.status || ('pending' as const)
        }))
        setTestCases(mappedTestCases)
        fetchFeatureDetails();
      } else {
        const updated = await featureService.updateStatus(feature.id, next)
        setFeature(updated)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update status");
    } finally {
      setAdvancing(false);
    }
  }

  const currentIndex = feature ? STATUS_ORDER.indexOf(feature.status) : -1;

  return (
    <>
    <StatusBlockedModal
      isOpen={!!blockedMsg}
      message={blockedMsg ?? ''}
      onClose={() => setBlockedMsg(null)}
    />
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1"
        >
          ← Back to Board
        </button>

        {loading && <Spinner />}
        {error && <Alert message={error} />}

        {feature && (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
              <div className="space-y-4">
                {/* Title + status */}
                 <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex flex-col gap-1 min-w-0 break-words">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 tracking-wider">#{feature.featureKey}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${feature.type === 'bug' ? 'bg-red-100 text-red-700' :
                      feature.type === 'hotfix' ? 'bg-orange-100 text-orange-700' :
                        feature.type === 'feature' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                      }`}>
                      {feature.type || 'task'}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">{feature.title}</h1>
                </div>
                <span className="shrink-0 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {STATUS_LABELS[feature.status]}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                <DescriptionDisplay content={feature.description} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Acceptance Criteria</p>
                <DescriptionDisplay content={feature.criteria} maxHeight={150} />
              </div>
          
            </div>

                {/* QA Section */}
                {feature.status === 'QA' && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">QA Panel</h2>
                    <QAPanel 
                      featureId={feature.id} 
                      onApproved={handleAdvance} 
                      initialTestCases={testCases}
                      onTestCasesChange={setTestCases}
                    />
                  </div>
                )}

                {/* AI Dev Plan Generation Module */}
                {feature.status === 'DEV' && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Development Plan</h2>
                    <DevPlanGenerator 
                      feature={feature} 
                      onStatusUpdated={(updated) => setFeature(updated)} 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Status Timeline and History */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status Timeline</p>
                      <p className="text-sm text-gray-500 mt-1">Progress and matching history entries</p>
                    </div>
                    <span className="text-xs text-gray-500">{feature.statusHistory?.length ?? 0} updates</span>
                  </div>

                  <div className="grid gap-4">
                    {STATUS_ORDER.map((status, index) => {
                      const isPast = index < currentIndex
                      const isCurrent = index === currentIndex
                      const entry = feature.statusHistory?.find((item) => item.status === status)
                      const markerBg = isPast ? 'bg-green-500 border-green-500 text-white' : isCurrent ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'

                      return (
                        <div key={status} className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] items-start rounded-2xl border border-gray-200 p-4 bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${markerBg}`}>
                              <span className="text-sm font-bold">{isPast ? '✓' : index + 1}</span>
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${isCurrent ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-gray-500'}`}>
                                {STATUS_LABELS[status]}
                              </p>
                              <p className="text-xs text-gray-500">
                                {entry ? formatDate(entry.changedAt) : 'No update yet'}
                              </p>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600">
                            {entry ? (
                              <p>Changed by {entry.changedBy.email}</p>
                            ) : (
                              <p className="text-gray-500">This status has not been reached yet.</p>
                            )}
                          </div>

                          {isCurrent && (
                            <span className="self-center rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                              Current
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Advance button */}
            {getNextStatus(feature.status) &&
              feature.status !== "QA" &&
              feature.status !== "DEV" && (
                <button
                  onClick={handleAdvance}
                  disabled={advancing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {advancing
                    ? "Advancing…"
                    : feature.status === "CREATED"
                      ? "Generate Test Cases"
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
    </>
  );
}
