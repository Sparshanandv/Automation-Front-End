# AI SDLC Automation Platform — Shared Context

A Jira replacement that uses AI (Amazon Bedrock / Claude) + GitHub to automate the software development lifecycle.

---

## TECH STACK

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | React + Redux Toolkit             |
| Backend        | Node.js + Express (REST)          |
| Database       | MongoDB (Mongoose)                |
| AI             | Amazon Bedrock (Claude)           |
| Infrastructure | AWS ECS, API Gateway, S3          |
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

## DATABASE COLLECTIONS

| Collection       | Key Fields                                           |
|------------------|------------------------------------------------------|
| users            | email, password_hash, createdAt                      |
| projects         | userId, name, description, repositories[]            |
| features         | projectId, title, description, criteria, status      |
| testcases        | featureId, content (Mixed)                           |
| plans            | featureId, content (Mixed)                           |
| codegenerations  | featureId, files (Mixed), s3Path                     |
| conversations    | featureId, role, message, createdAt                  |
| approvals        | featureId, stage, approvedBy, approvedAt             |

---

## API CONTRACT

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh

POST   /api/projects
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects/:id/repos
DELETE /api/projects/:id/repos/:repoId

POST   /api/features
GET    /api/features/:id
PUT    /api/features/:id
PATCH  /api/features/:id/status

POST   /api/ai/qa/generate/:featureId
POST   /api/ai/plan/generate/:featureId
POST   /api/ai/code/generate/:featureId
POST   /api/ai/chat/:featureId
GET    /api/ai/chat/:featureId/history

POST   /api/github/branch/:featureId
POST   /api/github/commit/:featureId
POST   /api/github/pr/:featureId
```

---

## MVP SCOPE

**IN:** JWT auth, projects, repos, features, status pipeline, AI (QA/plan/code), chat, GitHub automation
**OUT:** GitHub OAuth, team roles, notifications, analytics

# Frontend — React + Redux Toolkit

---

## FOLDER STRUCTURE

```
src/
├── components/
│   ├── Alert/Alert.tsx
│   ├── Badge/Badge.tsx            ← Badge + StatusBadge
│   ├── Button/Button.tsx
│   ├── Card/Card.tsx
│   ├── Input/Input.tsx            ← label + error + password toggle
│   ├── Navbar/Navbar.tsx
│   ├── PageWrapper/PageWrapper.tsx
│   ├── Spinner/Spinner.tsx
│   └── Toast/Toast.tsx
├── context/
│   └── ToastContext.tsx           ← useToast() hook + ToastProvider
├── layouts/
│   ├── PrivateLayout.tsx          ← Navbar + Outlet, redirects if no token
│   └── PublicLayout.tsx           ← Outlet, redirects if already logged in
├── pages/
│   ├── auth/
│   │   └── AuthPage.tsx
│   └── dashboard/
│       └── DashboardPage.tsx
├── routes/
│   └── index.tsx                  ← all route definitions in one place
├── services/
│   └── auth.service.ts            ← API calls only, no state
├── types/
│   └── index.ts                   ← all shared TypeScript types
├── utils/
│   ├── axios.ts                   ← axios instance + JWT interceptor
│   └── token.ts                   ← JWT storage and refresh logic
├── App.tsx
├── index.css                      ← @import "tailwindcss"
└── main.tsx
```

---

## WHEN PROJECT MODULE IS ADDED

The task board currently shows all features globally. When the project module is built:

1. **FeaturesPage.tsx** — add a project selector dropdown at the top; call `featureService.listByProject(projectId)` instead of `listAll()`
2. **CreateFeatureModal.tsx** — add a project dropdown field; pass `projectId` to `featureService.create()`
3. **feature.service.ts** — add `listByProject(projectId)` calling `GET /features?projectId=`
4. **types/index.ts** — `projectId` is already optional on `Feature`, just needs to be populated

---

## PAGES

### /login
- JWT login + signup form (tabbed)
- On success: store token, redirect to /dashboard
- Error shown as inline Alert inside the card

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
- Action button that matches current status

---

## COMMON COMPONENTS

```tsx
<Button variant="primary|secondary|danger|ghost" size="sm|md|lg" loading={bool} fullWidth />
<Input label="Email" type="email|password" error="msg" />   // password has show/hide toggle
<Card padding="sm|md|lg"> ... </Card>
<Badge label="text" variant="success|warning|info|neutral|danger" />
<StatusBadge status={feature.status} />
<Alert message="..." variant="error|success|warning|info" />
<Spinner size="sm|md|lg" />
<PageWrapper maxWidth="4xl"> ... </PageWrapper>

const toast = useToast()
toast('Message', 'success' | 'error' | 'info')
```

---

## CODING RULES

- All shared state lives in Redux store — no `useState` for data that crosses components.
- Local UI state (modal open, input value) can use `useState`.
- API calls only inside service files — never call API directly from components.
- JWT token stored in `localStorage`. Refresh logic in `token.ts` utility.
- All API calls go through the axios instance in `utils/axios.ts`.
- Axios interceptor skips `/auth/*` endpoints — 401 there means wrong credentials, not expired token.
- All API base URL from `import.meta.env.VITE_API_URL`.
- Feature status drives what is shown on the page — always derive UI from status.
- No hardcoded strings — status values go in `types/index.ts` as enums.
- Tailwind only — no CSS modules, no inline styles.

---

## TYPESCRIPT TYPES

```typescript
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
