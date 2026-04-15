export interface Repository {
  _id: string
  projectId: string
  repo_name: string
  branch: string
  purpose: 'FE' | 'BE' | 'Infra'
  createdAt: string
  updatedAt: string
}

export interface Project {
  _id: string
  name: string
  description?: string
  userId: string
  projectKey?: string
  createdByEmail?: string
  repos?: Repository[]
  createdAt: string
  updatedAt: string
}
