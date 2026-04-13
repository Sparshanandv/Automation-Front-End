type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'bg-green-600',
  error:   'bg-red-600',
  info:    'bg-blue-600',
}

const icons: Record<ToastVariant, string> = {
  success: '✓',
  error:   '✕',
  info:    'i',
}

export default function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white text-sm
            font-medium shadow-lg min-w-64 animate-fade-in ${variantClasses[t.variant]}`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center
            text-xs font-bold shrink-0">
            {icons[t.variant]}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
