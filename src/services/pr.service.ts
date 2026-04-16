import api from '../utils/axios'
import { PullRequest } from '../types'

export const prService = {
  async getPullRequest(featureId: string): Promise<PullRequest> {
    const res = await api.get<PullRequest>(`/ai/pr/${featureId}`)
    return res.data
  },

  async getAllPullRequests(projectId?: string): Promise<PullRequest[]> {
    const params = projectId ? { projectId } : {}
    const res = await api.get<PullRequest[]>('/ai/prs', { params })
    return res.data
  },
}
