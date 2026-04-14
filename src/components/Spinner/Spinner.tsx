import { Icons } from '../Icons/Icons'

type SpinnerSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

interface SpinnerProps {
  size?: SpinnerSize
  label?: string
}

export default function Spinner({ size = 'md', label = 'Loading…' }: SpinnerProps) {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <Icons.Spinner className={sizeClasses[size]} />
      {label}
    </div>
  )
}
