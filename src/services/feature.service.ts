import api from '../utils/axios'
import { Feature, FeatureStatus } from '../types'

export const featureService = {
  async listAll(projectId?: string): Promise<Feature[]> {
    const res = await api.get<Feature[]>('/features', { params: projectId ? { projectId } : undefined })
    return res.data
  },

  async getById(id: string): Promise<Feature> {
    const res = await api.get<Feature>(`/features/${id}`)
    return res.data
  },

  async create(title: string, description: string, criteria: string, projectId?: string): Promise<Feature> {
    const res = await api.post<Feature>('/features', { title, description, criteria, ...(projectId && { projectId }) })
    return res.data
  },

  async updateStatus(id: string, status: FeatureStatus): Promise<Feature> {
    const res = await api.patch<Feature>(`/features/${id}/status`, { status })
    return res.data
  },
}
