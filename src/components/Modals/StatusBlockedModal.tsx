import Button from '../Button/Button'

interface StatusBlockedModalProps {
  isOpen: boolean
  message: string
  onClose: () => void
}

export default function StatusBlockedModal({ isOpen, message, onClose }: StatusBlockedModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">Cannot Move Task</h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed pl-12">{message}</p>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <Button size="sm" onClick={onClose}>Got it</Button>
        </div>
      </div>
    </div>
  )
}
