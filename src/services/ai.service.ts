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

  async generatePlan(featureId: string, refinement?: string): Promise<Plan> {
    const res = await api.post<Plan>(`/ai/plan/generate/${featureId}`, { refinement })
    return res.data
  }
}
