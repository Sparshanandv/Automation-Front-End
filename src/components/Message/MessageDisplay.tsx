import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMessage, selectMessageByKey } from '../../store/messageSlice'
import { AppDispatch } from '../../store'

interface MessageDisplayProps {
  messageKey: string
  fallbackText?: string
  className?: string
}

export default function MessageDisplay({ messageKey, fallbackText, className }: MessageDisplayProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { content, loading, error } = useSelector(selectMessageByKey(messageKey))

  useEffect(() => {
    dispatch(fetchMessage(messageKey))
  }, [dispatch, messageKey])

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className ?? ''}`} role="status" aria-live="polite">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 ${className ?? ''}`} role="alert">
        <p className="text-red-500">{fallbackText ?? 'Message unavailable.'}</p>
        <button
          onClick={() => dispatch(fetchMessage(messageKey))}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <h1
      role="heading"
      aria-level={1}
      className={`text-2xl font-semibold ${className ?? ''}`}
    >
      {content ?? fallbackText ?? ''}
    </h1>
  )
}
