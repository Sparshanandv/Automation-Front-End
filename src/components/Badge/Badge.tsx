import type { FeatureStatus } from '../../types'

type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'danger'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info:    'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
  danger:  'bg-red-100 text-red-700',
}

// Maps FeatureStatus → badge variant
const statusVariantMap: Record<FeatureStatus, BadgeVariant> = {
  CREATED:       'neutral',
  QA:            'info',
  QA_APPROVED:   'info',
  DEV:           'warning',
  PLAN_APPROVED: 'warning',
  CODE_GEN:      'warning',
  PR_CREATED:    'success',
  DONE:          'success',
}

export function StatusBadge({ status }: { status: FeatureStatus }) {
  return <Badge label={status.replace('_', ' ')} variant={statusVariantMap[status]} />
}

export default function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${variantClasses[variant]}`}>
      {label}
    </span>
  )
}
