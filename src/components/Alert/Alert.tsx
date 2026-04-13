type AlertVariant = 'error' | 'success' | 'warning' | 'info'

interface AlertProps {
  message: string
  variant?: AlertVariant
  className?: string
}

const variantClasses: Record<AlertVariant, string> = {
  error:   'bg-red-50 border-red-200 text-red-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  info:    'bg-blue-50 border-blue-200 text-blue-700',
}

export default function Alert({ message, variant = 'error', className = '' }: AlertProps) {
  return (
    <div className={`px-4 py-3 rounded-lg border text-sm ${variantClasses[variant]} ${className}`}>
      {message}
    </div>
  )
}
