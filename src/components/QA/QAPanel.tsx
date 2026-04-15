import { useState, useEffect } from 'react'
import { TestCase } from '../../types'
import { qaService } from '../../services/qa.service'
import Button from '../Button/Button'
import Card from '../Card/Card'
import Spinner from '../Spinner/Spinner'
import Alert from '../Alert/Alert'

interface QAPanelProps {
  featureId: string
  onApproved?: () => void
  initialTestCases?: TestCase[]
  onTestCasesChange?: (testCases: TestCase[]) => void
}

export default function QAPanel({ featureId, onApproved, initialTestCases = [], onTestCasesChange }: QAPanelProps) {
  const [testCases, setTestCases] = useState<TestCase[]>(initialTestCases)
  
  // Reset locally if id changes
  useEffect(() => {
    setTestCases(initialTestCases)
  }, [featureId, initialTestCases])

  // Fetch test cases on mount if empty
  useEffect(() => {
    if (testCases.length === 0) {
      setLoading(true)
      qaService.getTestCases(featureId)
        .then(data => {
          const mappedTestCases = data.content.map(tc => ({
            ...tc,
            status: tc.status || ('pending' as const)
          }))
          setTestCases(mappedTestCases)
          onTestCasesChange?.(mappedTestCases)
        })
        .catch(err => {
          console.error('Failed to fetch test cases', err)
        })
        .finally(() => setLoading(false))
    }
  }, [featureId])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prompt, setPrompt] = useState('')
  const [showPromptInput, setShowPromptInput] = useState(false)

  async function handleGenerate(customPrompt?: string) {
    setLoading(true)
    setError('')
    setTestCases([])
    try {
      const isRegeneration = testCases.length > 0 || !!customPrompt
      const data = isRegeneration 
        ? await qaService.updateTestCases(featureId, customPrompt)
        : await qaService.generateTestCases(featureId)
      
      const mappedTestCases = data.content.map(tc => ({
        ...tc,
        status: tc.status || ('pending' as const)
      }))

      
      setTestCases(mappedTestCases)
      onTestCasesChange?.(mappedTestCases)
      setShowPromptInput(false)
    } catch (err: any) {
      setError('Failed to generate test cases. Please try again.')
    } finally {
      setPrompt('')
      setLoading(false)
    }
  }

  function handleUpdateStatus(testCaseId: string, status: 'approved' | 'rejected') {
    // Update locally only as per user request to only use the generation endpoint
    setTestCases(prev => prev.map(tc => tc.id === testCaseId ? { ...tc, status } : tc))
  }

  async function handleApproveAll() {
    setLoading(true)
    setError('')
    try {
      const updatedFeature = await qaService.approveTestCases(featureId)
      if (onApproved && updatedFeature) onApproved()
    } catch (err) {
      setError('Failed to approve test cases. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Test Cases</h2>
        <div className="flex gap-2">
          {testCases.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShowPromptInput(!showPromptInput)}>
              {showPromptInput ? 'Cancel' : 'Regenerate with Prompt'}
            </Button>
          )}
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleGenerate()} 
            loading={loading && !showPromptInput}
            disabled={loading}
          >
            {testCases.length > 0 ? 'Regenerate' : 'Generate Test Cases'}
          </Button>
        </div>
      </div>

      {error && <Alert message={error} />}

      {showPromptInput && (
        <Card className="bg-blue-50 border-blue-100" padding="sm">
          <textarea
            className="w-full p-3 rounded-lg border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Add specific instructions for test case generation..."
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <Button 
              size="sm" 
              onClick={() => handleGenerate(prompt)} 
              loading={loading}
              disabled={!prompt.trim()}
            >
              Generate with Prompt
            </Button>
          </div>
        </Card>
      )}

      {testCases.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-sm">No test cases generated yet. Click generate to begin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testCases.map((tc, index) => (
            <Card 
              key={tc.id || index} 
              padding="sm"
              className="overflow-hidden border-l-4 transition-all duration-200 hover:shadow-md border-l-blue-500"
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      tc.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      tc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {tc.status || 'pending'}
                    </span> */}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      tc.type === 'functional' ? 'bg-purple-100 text-purple-700' : 
                      tc.type === 'negative' ? 'bg-orange-100 text-orange-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {tc.type}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {tc.title}
                    </h3>
                  </div>
                </div>
                {/* <div className="flex gap-1">
                  <button 
                    onClick={() => handleUpdateStatus(tc.id, 'approved')}
                    className={`p-1.5 rounded-md transition-colors ${
                      tc.status === 'approved' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    title="Approve"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(tc.id, 'rejected')}
                    className={`p-1.5 rounded-md transition-colors ${
                      tc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    title="Reject"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div> */}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Steps</p>
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                    {tc.steps?.map((step, k) => (
                      <li key={k}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expected Result</p>
                  <p className="text-xs text-gray-600">{tc.expected}</p>
                </div>
              </div>
            </Card>
          ))}

          <Button 
            className="mt-6" 
            fullWidth 
            onClick={handleApproveAll}
            loading={loading}
            disabled={loading}
          >
            Approve All & Continue
          </Button>
        </div>
      )}
    </div>
  )
}
