import api from '../utils/axios'
import { QAGenerationResponse } from '../types'

export const qaService = {
  async generateTestCases(featureId: string): Promise<QAGenerationResponse> {
    const res = await api.post<QAGenerationResponse>(`/ai/qa/generate/${featureId}`)
    return res.data
  },

  async updateTestCases(featureId: string, prompt: string = ""): Promise<QAGenerationResponse> {
    const res = await api.post<QAGenerationResponse>(`/ai/qa/regenerate/${featureId}`, {
      promptToRegenerateQa: prompt
    })
    return res.data
  },
  
  async getTestCases(featureId: string): Promise<QAGenerationResponse> {
    const res = await api.get<QAGenerationResponse>(`/ai/qa/${featureId}`)
    return res.data
  },

  async approveTestCases(featureId: string): Promise<void> {
    await api.post(`/ai/qa/approve/${featureId}`)
  }
}
