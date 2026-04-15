import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Feature, FeatureStatus, StatusHistoryEntry, TestCase } from '../../types'
import { featureService } from '../../services/feature.service'
import { qaService } from '../../services/qa.service'
import { aiService } from '../../services/ai.service'
import { STATUS_ORDER, STATUS_LABELS, getNextStatus } from '../../utils/statusUtils'
import Spinner from '../../components/Spinner/Spinner'
import Alert from '../../components/Alert/Alert'
import QAPanel from '../../components/QA/QAPanel'
import MarkdownRenderer from '../../components/MarkdownRenderer/MarkdownRenderer'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const PLAN_STATUSES: FeatureStatus[] = ['DEV', 'PLAN_APPROVED', 'CODE_GEN', 'PR_CREATED', 'DONE']

export default function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Feature state
  const [feature, setFeature] = useState<Feature | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [advancing, setAdvancing] = useState(false)

  // Test cases state
  const [testCases, setTestCases] = useState<TestCase[]>([])

  // Plan state
  const [plan, setPlan] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [showGenForm, setShowGenForm] = useState(false)
  const [userStory, setUserStory] = useState('')
  const [optionalPrompt, setOptionalPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [planAction, setPlanAction] = useState<'approving' | 'rejecting' | null>(null)

  const fetchFeatureDetails = () => {
    featureService.getById(id)
      .then(f => {
        setFeature(f)
        setUserStory(`Feature: ${f.title}\n\nDescription:\n${f.description}\n\nAcceptance Criteria:\n${f.criteria}`)
      })
      .catch(() => setError('Failed to load task'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!id) return
    fetchFeatureDetails()

    // Load test cases from localStorage
    const saved = localStorage.getItem(`test-cases-${id}`)
    if (saved) {
      try {
        setTestCases(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved test cases', e)
        setTestCases([])
      }
    } else {
      setTestCases([])
    }
  }, [id])

  // Save test cases to localStorage when they change
  useEffect(() => {
    if (id && testCases.length > 0) {
      localStorage.setItem(`test-cases-${id}`, JSON.stringify(testCases))
    }
  }, [id, testCases])

  // Fetch plan whenever feature reaches DEV or beyond
  useEffect(() => {
    if (!id || !feature) return
    if (PLAN_STATUSES.includes(feature.status)) {
      setPlanLoading(true)
      setPlanError('')
      aiService.getPlan(id)
        .then(p => setPlan(p.content))
        .catch((error) => {
          setPlan(null)
          if (error.response?.status === 404) {
            setPlanError('Plan not found. It may have been rejected or failed to generate.')
          } else if (error.response?.status >= 500) {
            setPlanError('Server error loading plan. Please try again later.')
          } else {
            setPlanError('Failed to load plan. Please refresh the page.')
          }
        })
        .finally(() => setPlanLoading(false))
    } else {
      setPlan(null)
      setPlanError('')
    }
  }, [id, feature?.status])

  async function handleAdvance() {
    if (!feature) return
    const next = getNextStatus(feature.status)
    if (!next) return
    setAdvancing(true)
    setError('')
    try {
      if (feature.status === 'CREATED') {
        const data = await qaService.generateTestCases(feature.id)
        const mappedTestCases = data.content.map(tc => ({
          ...tc,
          status: tc.status || ('pending' as const)
        }))
        setTestCases(mappedTestCases)
        fetchFeatureDetails()
      } else {
        const updated = await featureService.updateStatus(feature.id, next)
        setFeature(updated)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update status')
    } finally {
      setAdvancing(false)
    }
  }

  async function handleGeneratePlan() {
    if (!id) return
    setGenerating(true)
    setPlanError('')
    try {
      const result = await aiService.generatePlan(id, {
        userStory,
        testCases: [],
        optionalPrompt: optionalPrompt.trim() || undefined,
      })
      setPlan(result.content)
      const updated = await featureService.getById(id)
      setFeature(updated)
      setShowGenForm(false)
    } catch {
      setPlanError('Plan generation failed. Ensure the Claude CLI is running and the feature is in QA_APPROVED status.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleApprovePlan() {
    if (!id) return
    setPlanAction('approving')
    try {
      await aiService.approvePlan(id)
      const updated = await featureService.getById(id)
      setFeature(updated)
    } catch {
      setError('Failed to approve plan')
    } finally {
      setPlanAction(null)
    }
  }

  async function handleRejectPlan() {
    if (!id) return
    setPlanAction('rejecting')
    try {
      await aiService.rejectPlan(id)
      const updated = await featureService.getById(id)
      setFeature(updated)
      setPlan(null)
    } catch {
      setError('Failed to reject plan')
    } finally {
      setPlanAction(null)
    }
  }

  const currentIndex = feature ? STATUS_ORDER.indexOf(feature.status) : -1
  const nextStatus = feature ? getNextStatus(feature.status) : null

  // Determine which bottom action to show
  const isQaApproved = feature?.status === 'QA_APPROVED'
  const isDev = feature?.status === 'DEV'
  const isPlanApproved = feature?.status === 'PLAN_APPROVED'
  const canRegeneratePlan = isDev && !plan && !planLoading
  const showRegularAdvance = nextStatus && !isQaApproved && !isDev && feature?.status !== 'QA'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/features')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1"
        >
          ← Back to Board
        </button>

        {loading && <Spinner />}
        {error && <Alert message={error} />}

        {feature && (
          <>
            {/* Title + status */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-xl font-bold text-gray-900">{feature.title}</h1>
                <span className="shrink-0 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {STATUS_LABELS[feature.status]}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{feature.description}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Acceptance Criteria</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{feature.criteria}</p>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Status Timeline</p>
              <div className="flex items-center gap-0">
                {STATUS_ORDER.map((status, index) => {
                  const isPast = index < currentIndex
                  const isCurrent = index === currentIndex
                  const isLast = index === STATUS_ORDER.length - 1

                  return (
                    <div key={status} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            isPast
                              ? 'bg-green-500 border-green-500 text-white'
                              : isCurrent
                              ? 'bg-blue-600 border-blue-600 text-white scale-110'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}
                        >
                          {isPast ? '✓' : index + 1}
                        </div>
                        <span
                          className={`text-center leading-tight whitespace-nowrap text-[10px] ${
                            isCurrent
                              ? 'text-blue-600 font-semibold'
                              : isPast
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className={`flex-1 h-0.5 mx-1 mb-4 ${
                            isPast ? 'bg-green-400' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* QA Section */}
            {feature.status === 'QA' && (
              <div className="mb-8">
                <QAPanel
                  featureId={feature.id}
                  onApproved={handleAdvance}
                  initialTestCases={testCases}
                  onTestCasesChange={setTestCases}
                />
              </div>
            )}

            {/* ── PLAN SECTION ── */}

            {/* QA_APPROVED or DEV with no plan: generate/regenerate plan trigger */}
            {(isQaApproved || canRegeneratePlan) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Development Plan</p>

                {canRegeneratePlan && !showGenForm && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No plan found for this feature. You can regenerate a plan below.
                    </p>
                  </div>
                )}

                {!showGenForm ? (
                  <button
                    onClick={() => setShowGenForm(true)}
                    className="w-full border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 font-medium py-3 rounded-xl transition-colors text-sm"
                  >
                    {canRegeneratePlan ? '🔄 Regenerate Development Plan' : '+ Generate Development Plan'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    {planError && <Alert message={planError} variant="error" />}

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                        User Story <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        rows={6}
                        value={userStory}
                        onChange={e => setUserStory(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Describe what needs to be built and why..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                        Additional Instructions <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={optionalPrompt}
                        onChange={e => setOptionalPrompt(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="e.g. Focus on the backend API only. Use idempotency keys..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleGeneratePlan}
                        disabled={generating || !userStory.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                      >
                        {generating ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Generating plan… (this may take up to 5 min)
                          </span>
                        ) : (
                          'Generate Plan'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowGenForm(false)
                          setPlanError('')
                        }}
                        disabled={generating}
                        className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors disabled:opacity-50"
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
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Development Plan</p>
                  {isPlanApproved && (
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Approved
                    </span>
                  )}
                </div>

                {planLoading && (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                )}

                {!planLoading && plan && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5 max-h-[600px] overflow-y-auto">
                    <MarkdownRenderer content={plan} />
                  </div>
                )}

                {!planLoading && !plan && (
                  <p className="text-sm text-gray-400 text-center py-4">No plan found.</p>
                )}

                {/* Approve / Reject — only shown in DEV status */}
                {isDev && plan && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleApprovePlan}
                      disabled={planAction !== null}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                    >
                      {planAction === 'approving' ? 'Approving…' : 'Approve Plan'}
                    </button>
                    <button
                      onClick={handleRejectPlan}
                      disabled={planAction !== null}
                      className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 font-medium py-2.5 rounded-xl transition-colors text-sm"
                    >
                      {planAction === 'rejecting' ? 'Rejecting…' : 'Reject & Regenerate'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Status History */}
            {feature.statusHistory?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Status History</p>
                <div className="flex flex-col gap-3">
                  {[...feature.statusHistory].reverse().map((entry: StatusHistoryEntry, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-800">{STATUS_LABELS[entry.status]}</span>
                          <span className="text-xs text-gray-400 shrink-0">{formatDate(entry.changedAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">by {entry.changedBy.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advance button for CREATED status (Generate Test Cases) */}
            {feature.status === 'CREATED' && (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {advancing ? 'Advancing…' : 'Generate Test Cases'}
              </button>
            )}

            {/* Regular advance button (for other statuses except QA, QA_APPROVED, and DEV) */}
            {showRegularAdvance && (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {advancing ? 'Advancing…' : `Advance to ${STATUS_LABELS[nextStatus as FeatureStatus]}`}
              </button>
            )}

            {/* QA_APPROVED: no separate advance button — plan generation handles the transition */}
            {isQaApproved && !showGenForm && (
              <p className="text-center text-xs text-gray-400 py-2">
                Generate a development plan above to advance to Dev stage.
              </p>
            )}

            {!nextStatus && (
              <div className="text-center py-3 text-green-600 font-semibold text-sm">
                ✓ This task is complete
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
