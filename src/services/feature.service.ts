import api from '../utils/axios'
import { Feature, FeatureStatus } from '../types'

export const featureService = {
  async listAll(): Promise<Feature[]> {
    const res = await api.get<Feature[]>('/features')
    return res.data
  },

  async getById(id: string): Promise<Feature> {
    const res = await api.get<Feature>(`/features/${id}`)
    return res.data
  },

  async create(title: string, description: string, criteria: string): Promise<Feature> {
    const res = await api.post<Feature>('/features', { title, description, criteria })
    return res.data
  },

  async updateStatus(id: string, status: FeatureStatus): Promise<Feature> {
    const res = await api.patch<Feature>(`/features/${id}/status`, { status })
    return res.data
  },
}
