# Clarvoy v2.0

## Overview
Clarvoy is a governance decision-support platform implementing "System 2 Governance" for mission-critical decisions. It enforces epistemic rigor, eliminates noise in group judgments, and tracks decision quality over time.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui (dark theme)
- **Backend**: Express.js with PostgreSQL (Drizzle ORM)
- **Auth**: Replit Auth (OpenID Connect)
- **AI**: Multi-LLM via Replit AI Integrations (OpenAI, Claude, Gemini)
- **Speech**: Web Speech API for voice-to-text input
- **Storage**: Replit Object Storage (GCS) for file uploads
- **Doc Parsing**: pdf-parse, mammoth, xlsx for text extraction

## Key Features
1. **Decision Dashboard** - Create and manage decision cases
2. **Blind Input Protocol** - Committee members submit independent scores (1-10) and rationales without seeing peers' inputs
3. **Noise Audit Engine** - Variance/standard deviation analysis of judgments to detect high noise
4. **AI Decision Coach** - Streaming chat with multi-LLM provider selection (OpenAI/Claude/Gemini)
5. **Voice Input** - Microphone button on all text entries for speech-to-text dictation
6. **File Uploads** - Upload PDFs, Word, Excel, PowerPoint, text, and image files as supporting evidence
7. **Document Parsing** - Automatic text extraction from uploaded documents for AI context
8. **Admin Analytics** - Bias heatmap visualization and audit log
9. **Group Consensus** - Results revealed only after decision is finalized

## Database Tables
- `users` + `sessions` (Replit Auth)
- `decisions` - Decision cases with status workflow (draft -> open -> closed)
- `judgments` - Blind inputs (score + rationale per user per decision)
- `comments` - Discussion/debate thread per decision
- `attachments` - File uploads with metadata and extracted text
- `audit_logs` - Immutable action log
- `conversations` + `messages` (OpenAI chat integration)

## Routes
- `/auth` - Landing/login page
- `/` - Dashboard (protected)
- `/new` - Create decision
- `/decisions/:id` - Decision detail with tabs (Overview, Judgments, Discussion)
- `/admin` - Analytics dashboard

## API Endpoints
- `GET/POST /api/decisions` - List/create decisions
- `GET/PUT/DELETE /api/decisions/:id` - Single decision CRUD
- `POST/GET /api/decisions/:decisionId/judgments` - Submit/list blind judgments
- `POST/GET /api/decisions/:decisionId/comments` - Submit/list comments
- `POST/GET /api/decisions/:decisionId/attachments` - Upload/list file attachments
- `GET /api/attachments/:id/text` - Get extracted text from attachment
- `DELETE /api/attachments/:id` - Delete attachment
- `POST /api/uploads/request-url` - Get presigned URL for file upload
- `GET /api/decisions/:decisionId/variance` - Noise analysis
- `POST /api/coaching/chat` - AI coaching (SSE streaming, accepts provider param, includes attachment context)
- `GET /api/coaching/providers` - List available LLM providers
- `GET /api/admin/audit-logs` - Audit log entries

## Key Components
- `client/src/components/MicrophoneButton.tsx` - Reusable voice input button (Web Speech API)
- `client/src/components/AICoach.tsx` - AI coaching chat with LLM provider selector
- `client/src/components/FileAttachments.tsx` - File upload/preview/delete component (full and compact modes)
- `client/src/hooks/use-attachments.ts` - Attachment CRUD hooks
- `client/src/hooks/use-upload.ts` - Presigned URL upload hook
- `server/services/llmService.ts` - Unified LLM routing (OpenAI/Claude/Gemini)
- `server/services/varianceEngine.ts` - Noise/variance analysis engine
- `server/services/documentParser.ts` - Text extraction from PDF/Word/Excel/PPT files
- `server/replit_integrations/object_storage/` - Object storage service and routes

## File Upload Flow
1. Client sends JSON metadata (name, size, contentType) to `/api/uploads/request-url`
2. Backend returns presigned URL and objectPath
3. Client uploads file directly to GCS via presigned URL (NOT to backend)
4. Client registers attachment via `POST /api/decisions/:id/attachments` with objectPath
5. Backend downloads file from GCS, extracts text (PDF/Word/Excel), stores in DB
6. AI Coach includes extracted text from attachments in its system prompt context

## Recent Changes
- Feb 15, 2026: File upload/document parsing with Replit Object Storage integration
- Feb 15, 2026: Added voice-to-text microphone buttons across all text entry areas
- Feb 15, 2026: Multi-LLM provider support (OpenAI, Claude, Gemini) for AI Coach
- Feb 15, 2026: Initial build with full decision workflow, blind input, AI coaching, auth
