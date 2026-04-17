export interface MessageData {
  _id: string
  key: string
  content: string
  isActive: boolean
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface MessageResponse {
  success: boolean
  data: MessageData
}

export interface MessageState {
  content: string | null
  loading: boolean
  error: string | null
}
