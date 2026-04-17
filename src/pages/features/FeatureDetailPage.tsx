import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Feature,
  FeatureStatus,
  StatusHistoryEntry,
  TestCase,
  PullRequest,
} from '../../types';
import { featureService } from '../../services/feature.service';
import { qaService } from '../../services/qa.service';
import { aiService } from '../../services/ai.service';
import { prService } from '../../services/pr.service';
import {
  STATUS_ORDER,
  STATUS_LABELS,
  getNextStatus,
  validateFeatureMove,
} from '../../utils/statusUtils';
import Spinner from '../../components/Spinner/Spinner';
import Alert from '../../components/Alert/Alert';
import QAPanel from '../../components/QA/QAPanel';
import MarkdownRenderer from '../../components/MarkdownRenderer/MarkdownRenderer';
import DescriptionDisplay from '../../components/common/DescriptionDisplay';
import StatusBlockedModal from '../../components/Modals/StatusBlockedModal';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PLAN_STATUSES: FeatureStatus[] = [
  'DEV',
  'PLAN_APPROVED',
  'CODE_GEN',
  'PR_CREATED',
  'DONE',
];

export default function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Feature state
  const [feature, setFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);

  // Test cases state
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Plan state
  const [plan, setPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [showGenForm, setShowGenForm] = useState(false);
  const [userStory, setUserStory] = useState('');
  const [optionalPrompt, setOptionalPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [planAction, setPlanAction] = useState<
    'approving' | 'rejecting' | null
  >(null);

  // Code generation state
  const [codeGenerating, setCodeGenerating] = useState(false);
  const [codeGenResult, setCodeGenResult] = useState<{
    filesWritten: string[];
    summary: string;
  } | null>(null);

  // Pull request state
  const [pullRequest, setPullRequest] = useState<PullRequest | null>(null);

  const fetchFeatureDetails = () => {
    if (!id) return;
    featureService
      .getById(id)
      .then((f) => {
        setFeature(f);
        setUserStory(
          `Feature: ${f.title}\n\nDescription:\n${f.description}\n\nAcceptance Criteria:\n${f.criteria}`,
        );
      })
      .catch(() => setError('Failed to load task'))
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
        console.error('Failed to parse saved test cases', e);
        setTestCases([]);
      }
    } else {
      setTestCases([]);
    }
  }, [id]);

  // Save test cases to localStorage when they change
  useEffect(() => {
    if (id && testCases.length > 0) {
      localStorage.setItem(`test-cases-${id}`, JSON.stringify(testCases));
    }
  }, [id, testCases]);

  // Fetch plan, code generation, and PR whenever feature reaches DEV or beyond
  useEffect(() => {
    if (!id || !feature) return;
    if (PLAN_STATUSES.includes(feature.status)) {
      setPlanLoading(true);
      setPlanError('');
      aiService
        .getPlan(id)
        .then((p) => setPlan(p.plan))
        .catch((error) => {
          setPlan(null);
          if (error.response?.status === 404) {
            setPlanError(
              'Plan not found. It may have been rejected or failed to generate.',
            );
          } else if (error.response?.status >= 500) {
            setPlanError('Server error loading plan. Please try again later.');
          } else {
            setPlanError('Failed to load plan. Please refresh the page.');
          }
        })
        .finally(() => setPlanLoading(false));

      // Also fetch code generation if status is PLAN_APPROVED or beyond
      if (
        ['PLAN_APPROVED', 'CODE_GEN', 'PR_CREATED', 'DONE'].includes(
          feature.status,
        )
      ) {
        aiService
          .getCodeGeneration(id)
          .then((result) => setCodeGenResult(result.result))
          .catch(() => {}); // Ignore if not found
      }

      // Fetch pull request if status is CODE_GEN or beyond
      if (['CODE_GEN', 'PR_CREATED', 'DONE'].includes(feature.status)) {
        prService
          .getPullRequest(id)
          .then(setPullRequest)
          .catch(() => {}); // Ignore if not found
      }
    } else {
      setPlan(null);
      setPlanError('');
    }
  }, [id, feature?.status]);

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
    setError('');
    try {
      if (feature.status === 'CREATED') {
        const data = await qaService.generateTestCases(feature.id);
        const mappedTestCases = data.content.map((tc) => ({
          ...tc,
          status: tc.status || ('pending' as const),
        }));
        setTestCases(mappedTestCases);
        fetchFeatureDetails();
      } else {
        const updated = await featureService.updateStatus(feature.id, next);
        setFeature(updated);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setAdvancing(false);
    }
  }

  async function handleGeneratePlan() {
    if (!id) return;
    setGenerating(true);
    setPlanError('');
    try {
      const result = await aiService.generatePlan(id, {
        userStory,
        testCases: [],
        optionalPrompt: optionalPrompt.trim() || undefined,
      });

      setPlan(result.plan);
      const updated = await featureService.getById(id);
      setFeature(updated);
      setShowGenForm(false);
    } catch {
      setPlanError(
        'Plan generation failed. Ensure the Claude CLI is running and the feature is in QA_APPROVED status.',
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprovePlan() {
    if (!id) return;
    setPlanAction('approving');
    try {
      await aiService.approvePlan(id);
      const updated = await featureService.getById(id);
      setFeature(updated);
    } catch {
      setError('Failed to approve plan');
    } finally {
      setPlanAction(null);
    }
  }

  async function handleRejectPlan() {
    if (!id) return;
    setPlanAction('rejecting');
    try {
      await aiService.rejectPlan(id);
      const updated = await featureService.getById(id);
      setFeature(updated);
      setPlan(null);
    } catch {
      setError('Failed to reject plan');
    } finally {
      setPlanAction(null);
    }
  }

  async function handleGenerateCode() {
    if (!id) return;
    setCodeGenerating(true);
    setError('');
    setCodeGenResult(null);
    try {
      const result = await aiService.executeCodeGeneration(id);
      setCodeGenResult(result.result);
      // Refresh feature to get updated status
      const updated = await featureService.getById(id);
      setFeature(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate code');
    } finally {
      setCodeGenerating(false);
    }
  }

  const getPRStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700';
      case 'merged':
        return 'bg-purple-100 text-purple-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const currentIndex = feature ? STATUS_ORDER.indexOf(feature.status) : -1;
  const nextStatus = feature ? getNextStatus(feature.status) : null;

  // Determine which bottom action to show
  const isQaApproved = feature?.status === 'QA_APPROVED';
  const isDev = feature?.status === 'DEV';
  const isPlanApproved = feature?.status === 'PLAN_APPROVED';
  const canRegeneratePlan = isDev && !plan && !planLoading;

  return (
    <>
      <StatusBlockedModal
        isOpen={!!blockedMsg}
        message={blockedMsg ?? ''}
        onClose={() => setBlockedMsg(null)}
      />
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-6xl mx-auto px-6 py-8'>
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className='text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1'
          >
            ← Back to Board
          </button>

          {loading && <Spinner />}
          {error && <Alert message={error} />}

          {feature && (
            <>
              <div className='grid gap-6 xl:grid-cols-[1.45fr_1fr]'>
                {/* LEFT COLUMN */}
                <div className='space-y-4'>
                  {/* Title + status */}
                  <div className='bg-white rounded-2xl border border-gray-200 p-6'>
                    <div className='flex items-start justify-between gap-4 mb-4'>
                      <div className='flex flex-col gap-1 min-w-0 break-words'>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs font-bold text-gray-400 tracking-wider'>
                            #{feature.featureKey}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              feature.type === 'bug'
                                ? 'bg-red-100 text-red-700'
                                : feature.type === 'hotfix'
                                  ? 'bg-orange-100 text-orange-700'
                                  : feature.type === 'feature'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {feature.type || 'task'}
                          </span>
                        </div>
                        <h1 className='text-xl font-bold text-gray-900'>
                          {feature.title}
                        </h1>
                      </div>
                      <span className='shrink-0 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full'>
                        {STATUS_LABELS[feature.status]}
                      </span>
                    </div>

                    <div className='mb-6 max-w-[45vw]'>
                      <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1'>
                        Description
                      </p>
                      <DescriptionDisplay content={feature.description} />
                    </div>

                    <div>
                      <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1'>
                        Acceptance Criteria
                      </p>
                      <DescriptionDisplay
                        content={feature.criteria}
                        maxHeight={150}
                      />
                    </div>
                  </div>

                  {/* QA Section */}
                  {feature.status === 'QA' && (
                    <div className='bg-white rounded-2xl border border-gray-200 p-6'>
                      <h2 className='text-sm font-semibold text-gray-900 mb-4'>
                        QA Panel
                      </h2>
                      <QAPanel
                        featureId={feature.id}
                        onApproved={fetchFeatureDetails}
                        initialTestCases={testCases}
                        onTestCasesChange={setTestCases}
                      />
                    </div>
                  )}

                  {/* QA_APPROVED or DEV with no plan: generate/regenerate plan trigger */}
                  {(isQaApproved || canRegeneratePlan) && (
                    <div className='bg-white rounded-2xl border border-gray-200 p-6'>
                      <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3'>
                        Development Plan
                      </p>

                      {canRegeneratePlan && !showGenForm && (
                        <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl'>
                          <p className='text-sm text-yellow-800'>
                            ⚠️ No plan found for this feature. You can
                            regenerate a plan below.
                          </p>
                        </div>
                      )}

                      {!showGenForm ? (
                        <button
                          onClick={() => setShowGenForm(true)}
                          className='w-full border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 font-medium py-3 rounded-xl transition-colors text-sm'
                        >
                          {canRegeneratePlan
                            ? '🔄 Regenerate Development Plan'
                            : '+ Generate Development Plan'}
                        </button>
                      ) : (
                        <div className='flex flex-col gap-3'>
                          {planError && (
                            <Alert message={planError} variant='error' />
                          )}

                          <div>
                            <label className='text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1'>
                              User Story <span className='text-red-400'>*</span>
                            </label>
                            <textarea
                              rows={6}
                              value={userStory}
                              onChange={(e) => setUserStory(e.target.value)}
                              className='w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400'
                              placeholder='Describe what needs to be built and why...'
                            />
                          </div>

                          <div>
                            <label className='text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1'>
                              Additional Instructions{' '}
                              <span className='text-gray-400 font-normal'>
                                (optional)
                              </span>
                            </label>
                            <textarea
                              rows={3}
                              value={optionalPrompt}
                              onChange={(e) =>
                                setOptionalPrompt(e.target.value)
                              }
                              className='w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400'
                              placeholder='e.g. Focus on the backend API only. Use idempotency keys...'
                            />
                          </div>

                          <div className='flex gap-2'>
                            <button
                              onClick={handleGeneratePlan}
                              disabled={generating || !userStory.trim()}
                              className='flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors text-sm'
                            >
                              {generating ? (
                                <span className='flex items-center justify-center gap-2'>
                                  <svg
                                    className='animate-spin h-4 w-4'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                  >
                                    <circle
                                      className='opacity-25'
                                      cx='12'
                                      cy='12'
                                      r='10'
                                      stroke='currentColor'
                                      strokeWidth='4'
                                    />
                                    <path
                                      className='opacity-75'
                                      fill='currentColor'
                                      d='M4 12a8 8 0 018-8v8H4z'
                                    />
                                  </svg>
                                  Generating plan… (this may take up to 5 min)
                                </span>
                              ) : (
                                'Generate Plan'
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setShowGenForm(false);
                                setPlanError('');
                              }}
                              disabled={generating}
                              className='px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors disabled:opacity-50'
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DEV / PLAN_APPROVED and beyond: show plan */}
                  {PLAN_STATUSES.includes(feature.status) && (
                    <div className='bg-white rounded-2xl border border-gray-200 p-6'>
                      <div className='flex items-center justify-between mb-3'>
                        <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide'>
                          Development Plan
                        </p>
                        {isPlanApproved && (
                          <span className='text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full'>
                            Approved
                          </span>
                        )}
                      </div>

                      {planLoading && (
                        <div className='flex justify-center py-6'>
                          <Spinner />
                        </div>
                      )}

                      {!planLoading && plan && (
                        <div className='bg-white rounded-xl border border-gray-100 p-5 max-h-[600px] overflow-y-auto'>
                          <MarkdownRenderer content={plan} />
                        </div>
                      )}

                      {!planLoading && !plan && (
                        <p className='text-sm text-gray-400 text-center py-4'>
                          No plan found.
                        </p>
                      )}

                      {/* Approve / Reject — only shown in DEV status */}
                      {isDev && plan && (
                        <div className='flex gap-2 mt-4'>
                          <button
                            onClick={handleApprovePlan}
                            disabled={planAction !== null}
                            className='flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors text-sm'
                          >
                            {planAction === 'approving'
                              ? 'Approving…'
                              : 'Approve Plan'}
                          </button>
                          <button
                            onClick={handleRejectPlan}
                            disabled={planAction !== null}
                            className='flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 font-medium py-2.5 rounded-xl transition-colors text-sm'
                          >
                            {planAction === 'rejecting'
                              ? 'Rejecting…'
                              : 'Reject & Regenerate'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Code Generation Section - shown when PLAN_APPROVED or beyond */}
                  {['PLAN_APPROVED', 'CODE_GEN', 'PR_CREATED', 'DONE'].includes(
                    feature.status,
                  ) && (
                    <div className='bg-white rounded-2xl border border-gray-200 p-6'>
                      <div className='flex items-center justify-between mb-4'>
                        <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide'>
                          Code Generation
                        </p>
                        {codeGenResult && (
                          <span className='text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full'>
                            ✓ {codeGenResult.filesWritten.length} file
                            {codeGenResult.filesWritten.length !== 1
                              ? 's'
                              : ''}{' '}
                            generated
                          </span>
                        )}
                      </div>

                      {isPlanApproved && !codeGenResult && (
                        <div className='text-center py-8'>
                          <div className='mb-4'>
                            <svg
                              className='w-16 h-16 mx-auto text-blue-500'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={1.5}
                                d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
                              />
                            </svg>
                          </div>
                          <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                            Ready to Generate Code
                          </h3>
                          <p className='text-sm text-gray-500 mb-6 max-w-md mx-auto'>
                            The development plan has been approved. Click below
                            to start AI-powered code generation based on the
                            plan.
                          </p>
                          <button
                            onClick={handleGenerateCode}
                            disabled={codeGenerating}
                            className='bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-2'
                          >
                            {codeGenerating ? (
                              <>
                                <Spinner />
                                <span>Generating Code...</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  className='w-5 h-5'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M13 10V3L4 14h7v7l9-11h-7z'
                                  />
                                </svg>
                                <span>Generate Code</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {codeGenerating && (
                        <div className='flex flex-col items-center py-8 gap-3'>
                          <Spinner />
                          <p className='text-sm text-gray-500'>
                            Generating code… this may take a minute
                          </p>
                        </div>
                      )}

                      {codeGenResult && (
                        <div className='space-y-4'>
                          <div className='bg-green-50 border border-green-200 rounded-xl p-4'>
                            <h4 className='text-sm font-semibold text-green-800 mb-1'>
                              Summary
                            </h4>
                            <p className='text-sm text-green-700'>
                              {codeGenResult.summary}
                            </p>
                          </div>

                          <div className='bg-gray-50 border border-gray-200 rounded-xl p-4'>
                            <h4 className='text-sm font-semibold text-gray-800 mb-3'>
                              Files Created
                              <span className='ml-2 text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full'>
                                {codeGenResult.filesWritten.length}
                              </span>
                            </h4>
                            <ul className='space-y-1.5'>
                              {codeGenResult.filesWritten.map((file, idx) => (
                                <li
                                  key={idx}
                                  className='text-xs text-gray-700 font-mono flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-1.5'
                                >
                                  <svg
                                    className='w-3.5 h-3.5 text-green-500 shrink-0'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                  </svg>
                                  {file}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pull Request Section - shown when CODE_GEN or beyond */}
                  {pullRequest && (
                    <div className='bg-white rounded-2xl border border-gray-200 p-6'>
                      <div className='flex items-center justify-between mb-3'>
                        <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide'>
                          Pull Request
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getPRStatusColor(pullRequest.status)}`}
                        >
                          {pullRequest.status}
                        </span>
                      </div>
                      <div className='space-y-2'>
                        <div className='flex items-start justify-between gap-4'>
                          <div className='flex-1'>
                            <h3 className='font-semibold text-gray-900 mb-2'>
                              {pullRequest.title}
                            </h3>
                            <div className='flex items-center gap-4 text-sm text-gray-600 mb-2'>
                              <span className='font-mono'>
                                #{pullRequest.pr_number}
                              </span>
                              <span>
                                {pullRequest.repository.owner}/
                                {pullRequest.repository.name}
                              </span>
                            </div>
                            <p className='text-xs text-gray-500 font-mono'>
                              {pullRequest.branch_name}
                            </p>
                          </div>
                          <a
                            href={pullRequest.pr_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='shrink-0 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1'
                          >
                            View on GitHub
                            <svg
                              className='w-4 h-4'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Status Timeline and History */}
                <div className='space-y-4'>
                  <div className='bg-white rounded-2xl border border-gray-200 p-6'>
                    <div className='flex items-center justify-between gap-4 mb-4'>
                      <div>
                        <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide'>
                          Status Timeline
                        </p>
                        <p className='text-sm text-gray-500 mt-1'>
                          Progress and matching history entries
                        </p>
                      </div>
                      <span className='text-xs text-gray-500'>
                        {feature.statusHistory?.length ?? 0} updates
                      </span>
                    </div>

                    <div className='grid gap-4'>
                      {STATUS_ORDER.map((status, index) => {
                        const isPast = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const entry = feature.statusHistory?.find(
                          (item) => item.status === status,
                        );
                        const markerBg = isPast
                          ? 'bg-green-500 border-green-500 text-white'
                          : isCurrent
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-400';

                        return (
                          <div
                            key={status}
                            className='grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] items-start rounded-2xl border border-gray-200 p-4 bg-slate-50'
                          >
                            <div className='flex items-center gap-3'>
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${markerBg}`}
                              >
                                <span className='text-sm font-bold'>
                                  {isPast ? '✓' : index + 1}
                                </span>
                              </div>
                              <div>
                                <p
                                  className={`text-sm font-semibold ${isCurrent ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-gray-500'}`}
                                >
                                  {STATUS_LABELS[status]}
                                </p>
                                <p className='text-xs text-gray-500'>
                                  {entry
                                    ? formatDate(entry.changedAt)
                                    : 'No update yet'}
                                </p>
                              </div>
                            </div>

                            <div className='text-sm text-gray-600'>
                              {entry ? (
                                <p>Changed by {entry.changedBy.email}</p>
                              ) : (
                                <p className='text-gray-500'>
                                  This status has not been reached yet.
                                </p>
                              )}
                            </div>

                            {isCurrent && (
                              <span className='self-center rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700'>
                                Current
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advance button */}
              {getNextStatus(feature.status) &&
                feature.status !== 'QA' &&
                feature.status !== 'DEV' &&
                feature.status !== 'PLAN_APPROVED' && (
                  <button
                    onClick={handleAdvance}
                    disabled={advancing}
                    className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 mt-6'
                  >
                    {advancing
                      ? 'Advancing…'
                      : feature.status === 'CREATED'
                        ? 'Generate Test Cases'
                        : `Advance to ${STATUS_LABELS[getNextStatus(feature.status) as FeatureStatus]}`}
                  </button>
                )}

              {/* QA_APPROVED: no separate advance button — plan generation handles the transition */}
              {isQaApproved && !showGenForm && (
                <p className='text-center text-xs text-gray-400 py-2 mt-6'>
                  Generate a development plan above to advance to Dev stage.
                </p>
              )}

              {!nextStatus && (
                <div className='text-center py-3 text-green-600 font-semibold text-sm mt-6'>
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
