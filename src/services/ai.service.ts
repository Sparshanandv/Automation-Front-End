import api from '../utils/axios'
import { TestCase, Plan } from '../types'

export const aiService = {
  async getQaResults(featureId: string): Promise<TestCase> {
    const res = await api.get<TestCase>(`/ai/qa/results/${featureId}`)
    return res.data
  },

  async getPlan(featureId: string): Promise<Plan> {
    const res = await api.get<Plan>(`/ai/plan/${featureId}`)
    return res.data
  },

  async generatePlan(
    featureId: string,
    body: { userStory: string; testCases: unknown[]; optionalPrompt?: string }
  ): Promise<Plan> {
    const res = await api.post<Plan>(`/ai/plan/generate/${featureId}`, body)
    return res.data
  },

  async approvePlan(featureId: string): Promise<void> {
    await api.post(`/ai/plan/approve/${featureId}`)
  },

  async rejectPlan(featureId: string): Promise<void> {
    await api.post(`/ai/plan/reject/${featureId}`)
  },
}
