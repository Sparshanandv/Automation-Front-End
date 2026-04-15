import { useState, useEffect } from 'react'
import { Feature, TestCase } from '../../types'
import { aiService } from '../../services/ai.service'
import { featureService } from '../../services/feature.service'
import Button from '../Button/Button'
import Card from '../Card/Card'
import Badge from '../Badge/Badge'
import Spinner from '../Spinner/Spinner'
import Alert from '../Alert/Alert'
import ConfirmationModal from '../modals/ConfirmationModal'

interface DevPlanGeneratorProps {
  feature: Feature
  onStatusUpdated: (updated: Feature) => void
}

export default function DevPlanGenerator({ feature, onStatusUpdated }: DevPlanGeneratorProps) {
  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [refinement, setRefinement] = useState('')
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [feature.id])

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const [tc, p] = await Promise.all([
        aiService.getQaResults(feature.id).catch(() => null),
        aiService.getPlan(feature.id).catch(() => null)
      ])
      setTestCase(tc)
      setPlan(p?.plan || null)
    } catch (err) {
      setError('Failed to fetch development data')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate(withRefinement = false) {
    setGenerating(true)
    setError('')
    try {
      const body = {
        userStory: feature.description,
        testCases: testCase?.content || [],
        optionalPrompt: withRefinement ? refinement : undefined
      }
      const result = await aiService.generatePlan(feature.id, body)
      setPlan(result.plan)
      if (withRefinement) setRefinement('')
    } catch (err) {
      setError('Failed to generate plan. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleAccept() {
    setGenerating(true)
    try {
      const updated = await featureService.updateStatus(feature.id, 'PLAN_APPROVED')
      onStatusUpdated(updated)
    } catch (err) {
      setError('Failed to update status')
    } finally {
      setGenerating(false)
    }
  }

  function handleRejectConfirm() {
    setPlan(null)
    setRefinement('')
    setIsRejectModalOpen(false)
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card title="AI Dev Plan Generation">
        <div className="space-y-6">
          {error && <Alert variant="error" message={error} />}

          {/* Context Section (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Feature Metadata</p>
              <h4 className="text-sm font-semibold text-gray-900">{feature.title}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-3">{feature.description}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">QA Context</p>
              {testCase ? (
                <div className="space-y-1">
                   <p className="text-xs text-gray-600">✓ Test cases retrieved</p>
                   <div className="max-h-20 overflow-y-auto text-[10px] text-gray-500 font-mono bg-white p-2 rounded border border-gray-200">
                      {JSON.stringify(testCase.content, null, 2)}
                   </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No test cases found for this feature.</p>
              )}
            </div>
          </div>

          {/* Plan Output Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Generated Plan</p>
              {plan && <Badge label="Draft Ready" variant="success" />}
            </div>

            {plan ? (
              <div className="prose prose-sm max-w-none bg-white p-6 rounded-xl border border-blue-100 shadow-sm min-h-[200px] whitespace-pre-wrap font-sans text-gray-800">
                {plan}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                {generating && <div className="mb-4"><Spinner size="md" /></div>}
                <p className="text-sm text-gray-500 mb-4">{generating ? 'Consulting the AI architect...' : 'No plan generated yet.'}</p>
                {!generating && (
                  <Button variant="primary" size="md" onClick={() => handleGenerate()}>
                    Generate Initial Plan
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Refinement Section */}
          {plan && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Refine with Additional Details</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Use Redis for caching, add logging for error cases..."
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={refinement}
                  onChange={(e) => setRefinement(e.target.value)}
                  disabled={generating}
                />
                <Button 
                  variant="secondary" 
                  size="md" 
                  onClick={() => handleGenerate(true)}
                  loading={generating && refinement !== ''}
                  disabled={generating}
                >
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          {/* Actions Section */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <Button 
              variant="danger" 
              size="md" 
              onClick={() => setIsRejectModalOpen(true)}
              disabled={generating || !plan}
            >
              Reject
            </Button>
            
            <div className="flex gap-3">
              {plan && (
                <>
                   <Button 
                    variant="ghost" 
                    size="md" 
                    onClick={() => handleGenerate(false)}
                    disabled={generating}
                  >
                    Regenerate (Full)
                  </Button>
                  <Button 
                    variant="primary" 
                    size="md" 
                    onClick={handleAccept}
                    loading={generating}
                    disabled={generating}
                  >
                    Accept & Advance
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <ConfirmationModal
        isOpen={isRejectModalOpen}
        title="Reject Development Plan?"
        message="This will clear the currently generated plan and reset the view. You will need to regenerate it from scratch. This action cannot be undone."
        confirmLabel="Yes, Reset"
        variant="danger"
        onConfirm={handleRejectConfirm}
        onCancel={() => setIsRejectModalOpen(false)}
      />
    </div>
  )
}
