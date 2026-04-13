import { HTMLAttributes } from 'react'

interface PageWrapperProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
}

const maxWidthClasses = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
}

export default function PageWrapper({ maxWidth = '4xl', className = '', children, ...props }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className={`${maxWidthClasses[maxWidth]} mx-auto px-6 py-10 ${className}`} {...props}>
        {children}
      </main>
    </div>
  )
}
