# CLAUDE.md — Clarvoy

## Project Overview

Clarvoy is a governance decision-support platform implementing **System 2 Governance** for mission-critical decisions. It enforces epistemic rigor, eliminates noise in group judgments, and tracks decision quality over time. The primary domain is Pennsylvania non-profit organizations serving adults with intellectual disabilities and autism.

## Architecture

```
client/          → React frontend (Vite + TailwindCSS + shadcn/ui, dark theme)
server/          → Express.js backend
shared/          → Shared types, schemas, and route definitions
  models/        → Drizzle ORM table definitions (auth.ts, chat.ts)
  schema.ts      → Re-exports models + decisions/judgments/comments/attachments/audit_logs/referenceClasses tables
  routes.ts      → Typed API route contracts (method, path, input/response schemas)
```

### Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS 3 + shadcn/ui (dark mode default)
- **Backend**: Express 5 on Node.js, single HTTP server serves both API and client
- **Database**: PostgreSQL via Drizzle ORM (`drizzle-orm` + `drizzle-zod`)
- **Auth**: Replit Auth (OpenID Connect) — `sessions` and `users` tables are mandatory
- **AI**: Multi-LLM streaming via OpenAI, Anthropic (Claude), and Google Gemini SDKs
- **Speech**: Web Speech API for voice-to-text input
- **File Storage**: Replit Object Storage (GCS) with presigned URL upload flow
- **Document Parsing**: `pdf-parse`, `mammoth`, `xlsx` for text extraction from uploads
- **Routing (client)**: `wouter` (not react-router)
- **State Management**: `@tanstack/react-query` for server state
- **Forms**: `react-hook-form` + `@hookform/resolvers` + `zod`
- **Charts**: `recharts` for bias heatmaps and variance visualizations
- **Animations**: `framer-motion`

## Database Schema

All tables defined in `shared/schema.ts` and `shared/models/`. Key tables:

| Table | Purpose |
|---|---|
| `users` | User profiles (Replit Auth, **do not drop**) |
| `sessions` | Session storage (Replit Auth, **do not drop**) |
| `decisions` | Decision cases with status workflow: `draft → open → closed` |
| `judgments` | Blind inputs: score (1-10) + rationale per user per decision |
| `comments` | Discussion/debate thread per decision |
| `attachments` | File uploads with metadata, objectPath, and extractedText |
| `audit_logs` | Immutable action log (userId, action, entityType, entityId, details) |
| `reference_classes` | Statistical reference data for outside-view forecasting |
| `conversations` / `messages` | AI coaching chat history |

Insert schemas are generated via `drizzle-zod` and exported alongside types from `shared/schema.ts`. Use `InsertDecision`, `InsertJudgment`, etc. for validated inputs.

### Schema Migrations

Run `npm run db:push` (uses `drizzle-kit push`) to sync schema changes to the database. No migration files — schema is pushed directly.

## API Endpoints

All routes defined in `server/routes.ts`, with typed contracts in `shared/routes.ts`.

| Method | Path | Description |
|---|---|---|
| `GET/POST` | `/api/decisions` | List / create decisions |
| `GET/PUT/DELETE` | `/api/decisions/:id` | Single decision CRUD |
| `POST/GET` | `/api/decisions/:decisionId/judgments` | Submit / list blind judgments |
| `POST/GET` | `/api/decisions/:decisionId/comments` | Submit / list comments |
| `POST/GET` | `/api/decisions/:decisionId/attachments` | Upload / list file attachments |
| `GET` | `/api/attachments/:id/text` | Get extracted text from attachment |
| `DELETE` | `/api/attachments/:id` | Delete attachment |
| `POST` | `/api/uploads/request-url` | Get presigned URL for file upload |
| `GET` | `/api/decisions/:decisionId/variance` | Noise analysis (variance engine) |
| `POST` | `/api/coaching/chat` | AI coaching chat (SSE streaming) |
| `GET` | `/api/coaching/providers` | List available LLM providers |
| `GET` | `/api/admin/audit-logs` | Audit log entries |

Auth endpoints are registered via `server/replit_integrations/auth/`. Object storage routes via `server/replit_integrations/object_storage/`.

## Client Routes

| Path | Component | Auth |
|---|---|---|
| `/auth` | `AuthPage` | Public |
| `/` | `Dashboard` | Protected |
| `/new` | `CreateDecision` | Protected |
| `/decisions/:id` | `DecisionDetail` | Protected |
| `/admin` | `AdminDashboard` | Protected |
| `/use-cases` | `UseCases` | Protected |

Protected routes use `<ProtectedRoute>` wrapper in `App.tsx` which redirects to `/auth` if unauthenticated.

## Key Services

### Variance Engine (`server/services/varianceEngine.ts`)
Calculates mean, standard deviation, coefficient of variation, and high-noise flag for judgment scores. Threshold default: stdDev > 1.5 = high noise.

### LLM Service (`server/services/llmService.ts`)
Unified streaming interface for OpenAI, Claude, and Gemini. All providers use SSE (`text/event-stream`). The coaching chat includes decision context, judgment variance data, and extracted attachment text in the system prompt.

### Document Parser (`server/services/documentParser.ts`)
Extracts text from uploaded PDFs, Word docs, Excel files, and PowerPoint presentations. Extracted text is stored in the `attachments.extractedText` column and included in AI coaching context.

### Object Storage (`server/replit_integrations/object_storage/`)
Wraps Replit Object Storage (GCS). Presigned URL upload flow: client requests URL → uploads directly → creates attachment record.

## Key Components

| Component | Location | Purpose |
|---|---|---|
| `Sidebar` | `client/src/components/Sidebar.tsx` | Main navigation sidebar |
| `AICoach` | `client/src/components/AICoach.tsx` | AI coaching chat with LLM provider selector |
| `MicrophoneButton` | `client/src/components/MicrophoneButton.tsx` | Reusable voice input (Web Speech API) |
| `FileAttachments` | `client/src/components/FileAttachments.tsx` | File upload/preview/delete (full and compact modes) |
| `BlindInputForm` | Used in `DecisionDetail` | Score + rationale submission form |

### Custom Hooks

- `use-auth.ts` — Replit Auth user/session state
- `use-decisions.ts` — Decision CRUD mutations and queries
- `use-attachments.ts` — Attachment CRUD hooks
- `use-upload.ts` — Presigned URL upload hook

## Conventions

### Code Style
- TypeScript throughout (strict mode, `tsconfig.json`)
- ESM modules (`"type": "module"` in package.json)
- Path aliases: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- Zod for runtime validation on both client and server
- All API handlers check `req.isAuthenticated()` for protected routes
- User ID extracted via `(req.user as any).claims.sub`

### UI / Design
- Dark theme is the default and only theme
- shadcn/ui components in `client/src/components/ui/`
- `lucide-react` for icons
- Font: uses `font-display` class for headings (display font)
- Color scheme: primary (emerald-ish), muted foreground for secondary text, `white/5` and `white/10` borders
- Responsive layout with fixed sidebar (64px / `w-64` / `ml-64`)

### AI Coaching Prompt
The AI Decision Coach system prompt is defined inline in `server/routes.ts`. It uses HTML formatting (`<b>`, `<i>`, `<br>`) instead of markdown. The coach persona is warm, encouraging, and focused on PA disability services governance. It references pre-mortem analysis, reference class forecasting, base rates, and adversarial debate.

### File Upload Flow
1. Client sends JSON metadata (`name`, `size`, `contentType`) to `POST /api/uploads/request-url`
2. Server returns a presigned upload URL
3. Client uploads file directly to the presigned URL
4. Client creates an attachment record via `POST /api/decisions/:decisionId/attachments`
5. Server extracts text from parseable files and stores it in `attachments.extractedText`

Allowed MIME types: PDF, plain text, Word (.doc/.docx), PowerPoint (.ppt/.pptx), Excel (.xls/.xlsx), JPEG, PNG. Max size: 10MB.

### Demo Data
`server/seed/demoData.ts` seeds 8 PA-specific use case scenarios with reference class data, blind inputs, and bias detection examples. Demo decisions are marked with `isDemo: true`. Three demo reviewer users are created automatically.

## Running the App

```bash
npm run dev          # Development (Vite HMR + Express)
npm run build        # Production build
npm run start        # Production server
npm run db:push      # Push schema changes to PostgreSQL
npm run check        # TypeScript type checking
```

The server listens on `process.env.PORT` (default 5000) and serves both the API and the client from the same process.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required)
- `PORT` — Server port (default: 5000)
- LLM API keys are configured via Replit AI Integrations (OpenAI, Anthropic, Google)

## Domain Context

Clarvoy is purpose-built for PA non-profit disability services governance. Key domain concepts:

- **Blind Input Protocol**: Committee members submit independent scores and rationales without seeing peers' inputs to reduce groupthink
- **Noise Audit**: Statistical analysis (variance, stdDev, CV) of judgment scores to detect disagreement/noise
- **Reference Class Forecasting**: Outside-view data (e.g., "94 PA nonprofit housing projects averaged 1.28x cost overruns") to anchor decisions
- **Pre-Mortem Analysis**: Imagining failure scenarios before deciding
- **Epistemic Constitution**: The governance framework's guiding principles ("Laws" like Blind Input, Outside View, Cognitive Sovereignty)
- **PA-specific context**: HCBS waivers, DSP workforce, aging-out cliff, Supported Decision-Making, Medicaid restructuring risks
