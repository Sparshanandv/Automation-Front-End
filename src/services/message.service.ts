import api from '../utils/axios'
import { MessageResponse } from '../types/message.types'

export async function getMessageByKey(key: string): Promise<MessageResponse> {
  const res = await api.get<MessageResponse>(`/messages/${key}`, { timeout: 30000 })
  return res.data
}
