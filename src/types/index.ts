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

export interface TestCase {
  id: string
  title: string
  steps: string[]
  expected: string
  type: string
  status?: 'pending' | 'approved' | 'rejected'
}

export interface QAGenerationResponse {
  _id: string
  feature_id: string
  content: TestCase[]
  createdAt: string
  updatedAt: string
}

export interface TestCase {
  id: string
  feature_id: string
  content: any
}

export interface Plan {
  _id: string
  feature_id: string
  content: string
  refinements: string[]
  createdAt: string
  updatedAt: string
}
