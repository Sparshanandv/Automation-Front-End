export type FeatureStatus =
  | 'CREATED'
  | 'QA'
  | 'QA_APPROVED'
  | 'DEV'
  | 'PLAN_APPROVED'
  | 'CODE_GEN'
  | 'PR_CREATED'
  | 'DONE'

export type RepoPurpose = 'frontend' | 'backend' | 'infra'
export type MessageRole = 'user' | 'ai'

export interface User {
  id: string
  email: string
}

export interface Repository {
  id: string
  repoName: string
  branch: string
  purpose: RepoPurpose
}

export interface Project {
  id: string
  name: string
  description: string
  repositories: Repository[]
}

export interface StatusHistoryEntry {
  status: FeatureStatus
  changedBy: { id: string; email: string }
  changedAt: string
}

export interface Feature {
  id: string
  title: string
  description: string
  criteria: string
  status: FeatureStatus
  statusHistory: StatusHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: MessageRole
  message: string
  createdAt: string
}
