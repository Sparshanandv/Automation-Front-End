# AI SDLC Automation Platform — Shared Context

A Jira replacement that uses AI (Amazon Bedrock / Claude) + GitHub to automate the software development lifecycle.

---

## TECH STACK

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | React + NgRx                      |
| Backend        | Node.js + NestJS (REST)           |
| Database       | PostgreSQL (TypeORM)              |
| AI             | Amazon Bedrock (Claude)           |
| Infrastructure | AWS ECS, API Gateway, RDS, S3     |
| Auth           | JWT (access + refresh tokens)     |

---

## STATUS FLOW

```
CREATED → QA → QA_APPROVED → DEV → PLAN_APPROVED → CODE_GEN → PR_CREATED → DONE
```

| Transition               | Trigger        | Action                       |
|--------------------------|----------------|------------------------------|
| CREATED → QA             | User action    | AI generates test cases      |
| QA → QA_APPROVED         | Human approval | Lock test cases              |
| QA_APPROVED → DEV        | User action    | AI generates dev plan        |
| DEV → PLAN_APPROVED      | Human approval | Lock dev plan                |
| PLAN_APPROVED → CODE_GEN | User action    | AI generates code            |
| CODE_GEN → PR_CREATED    | Auto-triggered | GitHub: branch → commit → PR |
| PR_CREATED → DONE        | PR merged      | Feature complete             |

---

## DATABASE TABLES

| Table            | Key Fields                                           |
|------------------|------------------------------------------------------|
| users            | id, email, password_hash, created_at                 |
| projects         | id, user_id, name, description                       |
| repositories     | id, project_id, repo_name, branch, purpose           |
| features         | id, project_id, title, description, criteria, status |
| test_cases       | id, feature_id, content (JSON)                       |
| plans            | id, feature_id, content (JSON)                       |
| code_generations | id, feature_id, files (JSON), s3_path                |
| conversations    | id, feature_id, role, message, created_at            |
| approvals        | id, feature_id, stage, approved_by, approved_at      |

---

## API CONTRACT

```
POST   /auth/signup
POST   /auth/login
POST   /auth/refresh

POST   /projects
GET    /projects
GET    /projects/:id
POST   /projects/:id/repos
DELETE /projects/:id/repos/:repoId

POST   /features
GET    /features/:id
PUT    /features/:id
PATCH  /features/:id/status

POST   /ai/qa/generate/:featureId
POST   /ai/plan/generate/:featureId
POST   /ai/code/generate/:featureId
POST   /ai/chat/:featureId
GET    /ai/chat/:featureId/history

POST   /github/branch/:featureId
POST   /github/commit/:featureId
POST   /github/pr/:featureId
```

---

## MVP SCOPE

**IN:** JWT auth, projects, repos, features, status pipeline, AI (QA/plan/code), chat, GitHub automation
**OUT:** GitHub OAuth, team roles, notifications, analytics

# Frontend — React + NgRx

Shared context (stack, status flow, API contract) is in ~/.claude/CLAUDE.md and loaded automatically.

---

## FOLDER STRUCTURE

```
src/
├── app/
│   ├── store/
│   │   ├── auth/
│   │   │   ├── auth.actions.ts
│   │   │   ├── auth.reducer.ts
│   │   │   ├── auth.effects.ts
│   │   │   └── auth.selectors.ts
│   │   ├── projects/
│   │   │   ├── projects.actions.ts
│   │   │   ├── projects.reducer.ts
│   │   │   ├── projects.effects.ts
│   │   │   └── projects.selectors.ts
│   │   ├── features/
│   │   │   ├── features.actions.ts
│   │   │   ├── features.reducer.ts
│   │   │   ├── features.effects.ts
│   │   │   └── features.selectors.ts
│   │   ├── ai/
│   │   │   ├── ai.actions.ts
│   │   │   ├── ai.reducer.ts
│   │   │   ├── ai.effects.ts
│   │   │   └── ai.selectors.ts
│   │   └── index.ts
│   ├── pages/
│   │   ├── login/
│   │   │   ├── LoginPage.tsx
│   │   │   └── LoginPage.module.css
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── DashboardPage.module.css
│   │   ├── project-detail/
│   │   │   ├── ProjectDetailPage.tsx
│   │   │   └── ProjectDetailPage.module.css
│   │   └── feature-detail/
│   │       ├── FeatureDetailPage.tsx
│   │       └── FeatureDetailPage.module.css
│   ├── components/
│   │   ├── StatusBadge/
│   │   ├── AIChatPanel/
│   │   ├── ApprovalPanel/
│   │   ├── FeatureCard/
│   │   ├── RepoCard/
│   │   └── Navbar/
│   ├── services/
│   │   ├── auth.service.ts        ← API calls only, no state
│   │   ├── project.service.ts
│   │   ├── feature.service.ts
│   │   ├── ai.service.ts
│   │   └── github.service.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useFeatureStatus.ts
│   ├── utils/
│   │   ├── token.ts               ← JWT storage and refresh logic
│   │   └── status.ts              ← status helper functions
│   ├── types/
│   │   └── index.ts               ← all shared TypeScript types
│   ├── App.tsx
│   └── main.tsx
```

---

## PAGES

### /login
- JWT login form (email + password)
- On success: store token, redirect to /dashboard
- No GitHub OAuth for MVP

### /dashboard
- List all projects for the logged-in user
- Link to each project detail
- Button to create new project

### /projects/:id
- Project name + linked repos (with purpose badge)
- List of features with status badges
- Button to add repo, button to create feature

### /features/:id
- Feature title, description, acceptance criteria
- Current status + status timeline
- AI output panel (test cases / plan / code — based on status)
- Approval button (shown when approval is required)
- AI Chat panel (slide-in or bottom panel)
- Action button that matches current status (e.g. "Generate Test Cases", "Generate Plan")

---

## NGRX STORE SHAPE

```typescript
AppState {
  auth: {
    user: User | null
    token: string | null
    loading: boolean
    error: string | null
  }
  projects: {
    list: Project[]
    selected: Project | null
    loading: boolean
    error: string | null
  }
  features: {
    list: Feature[]
    selected: Feature | null
    statusLoading: boolean
    error: string | null
  }
  ai: {
    testCases: TestCase[] | null
    plan: Plan | null
    code: CodeGeneration | null
    chatMessages: Message[]
    generating: boolean
    sending: boolean
    error: string | null
  }
}
```

---

## API SERVICES (services/)

Each service file only makes API calls — no state management.
State is managed by NgRx effects only.

```typescript
// auth.service.ts
signup(email, password): Promise<AuthResponse>
login(email, password): Promise<AuthResponse>
refresh(): Promise<AuthResponse>

// project.service.ts
getProjects(): Promise<Project[]>
getProject(id): Promise<Project>
createProject(data): Promise<Project>
addRepo(projectId, data): Promise<Repository>

// feature.service.ts
getFeature(id): Promise<Feature>
createFeature(data): Promise<Feature>
updateStatus(id, status): Promise<Feature>

// ai.service.ts
generateQA(featureId): Promise<TestCase[]>
generatePlan(featureId): Promise<Plan>
generateCode(featureId): Promise<CodeGeneration>
sendChat(featureId, message): Promise<Message>
getChatHistory(featureId): Promise<Message[]>
```

---

## KEY COMPONENTS

### StatusBadge
- Takes `status: FeatureStatus`
- Renders color-coded pill matching the status
- Used on every feature card and feature detail page

### AIChatPanel
- Slide-in panel anchored to feature detail
- Renders chat history (user + AI messages)
- Input box to send message
- Shows typing indicator while `ai.sending === true`
- Supports streaming — append tokens as they arrive

### ApprovalPanel
- Shown only when `feature.status === 'QA' || 'DEV'`
- Displays current AI output (test cases or plan)
- Approve button → dispatches `approveStage` action
- Edit option → opens inline editor before approving

---

## CODING RULES

- All shared state lives in NgRx store — no `useState` for data that crosses components.
- Local UI state (modal open, input value) can use `useState`.
- API calls only inside NgRx effects — never call services directly from components.
- Use `useSelector` to read from store, `useDispatch` to fire actions.
- JWT token stored in `localStorage`. Refresh logic in `token.ts` utility.
- All API base URL from `import.meta.env.VITE_API_URL`.
- Feature status drives what is shown on the page — always derive UI from status, never from separate flags.
- No hardcoded strings — status values, roles, and purposes go in `types/index.ts` as enums.
- CSS Modules for all component styles — no global styles except reset and variables.

---

## TYPESCRIPT TYPES

```typescript
// types/index.ts

type FeatureStatus =
  | 'CREATED' | 'QA' | 'QA_APPROVED'
  | 'DEV' | 'PLAN_APPROVED'
  | 'CODE_GEN' | 'PR_CREATED' | 'DONE'

type RepoPurpose = 'frontend' | 'backend' | 'infra'

type MessageRole = 'user' | 'ai'

interface User { id: string; email: string }
interface Project { id: string; name: string; description: string; repositories: Repository[] }
interface Repository { id: string; repoName: string; branch: string; purpose: RepoPurpose }
interface Feature { id: string; title: string; description: string; criteria: string; status: FeatureStatus }
interface Message { id: string; role: MessageRole; message: string; createdAt: string }
```

---

## ENVIRONMENT VARIABLES

```
VITE_API_URL=http://localhost:3000
```
