<p align="center">
  <img src=".github/banner.png" alt="AI-Based Exam Evaluation System Banner" width="100%" />
</p>

<p align="center">
  <a href="https://opensource.org/licenses/ISC"><img src="https://img.shields.io/badge/License-ISC-blue.svg" alt="License: ISC" /></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white" alt="Node.js 18+" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express 5" /></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://www.langchain.com/langgraph"><img src="https://img.shields.io/badge/LangGraph-Agent-1C3C3C?logo=langchain&logoColor=white" alt="LangGraph" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
</p>

<p align="center">
  A production-grade, microservice-driven exam management platform that uses <b>LangGraph AI agents</b> to generate exams from classroom materials and <b>strict-RAG evaluation</b> to grade subjective answers — all within a real-time, glassmorphic dashboard.
</p>

<p align="center">
  <a href="https://ai-based-exam-evaluation-system.vercel.app"><b>🌐 Live Demo</b></a> •
  <a href="#-getting-started"><b>🚀 Getting Started</b></a> •
  <a href="#-api-reference"><b>📡 API Reference</b></a> •
  <a href="#-contributing"><b>🤝 Contributing</b></a>
</p>

---

## 📑 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Workflows](#-workflows)
  - [Authentication Flow](#1-authentication-flow)
  - [Exam Lifecycle](#2-exam-lifecycle)
  - [AI Agent Workflow](#3-ai-agent-workflow)
  - [AI Evaluation Pipeline](#4-ai-evaluation-pipeline)
- [API Reference](#-api-reference)
- [Agent Service Deep Dive](#-agent-service-deep-dive)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License & Author](#-license--author)

---

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Agentic Exam Generation** — A LangGraph-powered conversational agent creates exams from uploaded classroom materials (PDFs, DOCX). Teachers can iteratively refine the draft in a chat interface.
- **Strict-RAG Evaluation** — Subjective answers are graded using only the teacher's uploaded reference materials. No hallucinated knowledge is used. The LLM prompt explicitly enforces: *"Evaluate based only on provided materials."*
- **LLM Fallback Chain** — If Groq's API goes down, the system automatically tries Cerebras → OpenRouter → HuggingFace. Zero downtime.
- **Zero-Token Intent Parsing** — Simple teacher commands like *"Change marks for question 3 to 10"* are handled via RegEx without wasting LLM API tokens.

### 🏫 Classroom Management
- **Create & Join Classrooms** — Teachers create classrooms with unique join codes. Students request access; teachers approve or reject.
- **Material Upload & Auto-Embedding** — Upload PDFs and DOCX files to Cloudinary. Materials are automatically chunked and embedded into ChromaDB for the AI agent.
- **Role-Based Access** — Every resource is scoped to the user's role (teacher or student) with middleware guards.

### 📝 Exam Lifecycle
- **State Machine** — Exams flow through strict states: `Draft` → `Scheduled` → `Live` → `Completed`. Each transition is validated server-side.
- **Real-Time Autosave** — Student answers are synced to the database every 30 seconds via debounced PATCH requests, surviving network drops and browser crashes.
- **Anti-Cheating** — Tab-switch and visibility-change violations are logged automatically during live exams.

### 🔐 Security
- **Dual Authentication** — Native email/password (BCrypt hashing) + Google OAuth 2.0.
- **JWT Token Rotation** — Short-lived access tokens with long-lived refresh tokens, stored in HTTP-only cookies.
- **Rate Limiting** — Upstash Redis-powered rate limiting across all endpoints (global, auth, email, AI evaluation).
- **Email Verification** — Accounts require email confirmation before creating classrooms or publishing exams.

### 📊 Analytics & Insights
- **Recharts Dashboards** — Visual analytics for teachers: score distribution, question-level performance, submission timelines.
- **CSV Export** — Export student profiles, submissions, and exam data to CSV.
- **Teacher Grade Override** — Teachers can review AI-generated scores and override them with manual grades.

### ⚡ Real-Time
- **Socket.IO** — Live WebSocket events for exam status changes, submission updates, and classroom notifications.
- **SSE Streaming** — The AI agent streams its step-by-step thinking process to the frontend in real-time via Server-Sent Events.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ Frontend (Vercel)"]
        React["React 19 + Vite 7<br/>Tailwind CSS 4"]
    end

    subgraph Server["⚙️ Backend (Render)"]
        Express["Node.js / Express 5"]
        BullMQ["BullMQ Job Queue"]
        SocketIO["Socket.IO"]
    end

    subgraph Agent["🤖 Agent Service (Render)"]
        FastAPI["Python / FastAPI"]
        LangGraph["LangGraph Agent"]
        ChromaDB["ChromaDB Vector Store"]
    end

    subgraph External["☁️ External Services"]
        MongoDB[("MongoDB Atlas")]
        Redis[("Upstash Redis")]
        Cloudinary["Cloudinary CDN"]
        LLMs["LLM APIs<br/>Groq • Cerebras<br/>OpenRouter • HuggingFace"]
    end

    React <-->|"REST + WebSocket"| Express
    Express <-->|"REST + SSE"| FastAPI
    FastAPI --> LangGraph
    LangGraph --> ChromaDB
    FastAPI -->|"Inference API"| LLMs
    Express --> MongoDB
    Express --> Redis
    Express --> Cloudinary
    Express --> BullMQ
    BullMQ --> FastAPI
    SocketIO <-->|"Real-time events"| React

    classDef client fill:#1e3a5f,stroke:#60a5fa,stroke-width:2px,color:#fff
    classDef server fill:#1a3c34,stroke:#34d399,stroke-width:2px,color:#fff
    classDef agent fill:#3b1f6e,stroke:#c084fc,stroke-width:2px,color:#fff
    classDef external fill:#1f1f1f,stroke:#94a3b8,stroke-width:2px,color:#fff

    class React client
    class Express,BullMQ,SocketIO server
    class FastAPI,LangGraph,ChromaDB agent
    class MongoDB,Redis,Cloudinary,LLMs external
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4 | SPA framework, build tool, styling |
| | Framer Motion, Recharts | Animations, data visualization |
| | Socket.IO Client | Real-time WebSocket events |
| | React Router 7, React Toastify | Navigation, notifications |
| | `@react-oauth/google` | Google OAuth integration |
| **Backend** | Node.js 18+, Express 5 | API server framework |
| | Mongoose 8, MongoDB Atlas | ODM and cloud database |
| | BullMQ, Upstash Redis | Job queue and caching/rate-limiting |
| | Socket.IO | Real-time bidirectional communication |
| | Nodemailer | Transactional emails |
| | Cloudinary, Multer | File upload and cloud storage |
| | Helmet, CORS, BCrypt | Security hardening |
| | JSON Web Tokens | Authentication |
| **Agent** | Python 3.12, FastAPI | AI microservice framework |
| | LangGraph, LangChain Core | Agentic AI graph workflows |
| | ChromaDB | Local vector database for RAG |
| | HuggingFace Inference API | Remote text embeddings |
| | Groq / Cerebras / OpenRouter | LLM inference (fallback chain) |

---

## 📂 Project Structure

```
AI-Based-Exam-Evaluation-System/
├── client/                          # React Frontend
│   └── src/
│       ├── components/              # Reusable UI (Header, Sidebar, AgentChat, Charts)
│       ├── context/                 # React Context (Auth, Socket)
│       ├── hooks/                   # Custom hooks
│       ├── pages/
│       │   ├── teacher/             # Teacher dashboard, exam creation, AI generator
│       │   └── student/             # Student dashboard, exam taking, results
│       ├── services/                # API client (Axios instance)
│       └── routes/                  # Route definitions
│
├── server/                          # Node.js Backend
│   └── src/
│       ├── controllers/             # Request handlers (9 controllers)
│       ├── models/                  # Mongoose schemas (User, Exam, Question, Submission, etc.)
│       ├── routes/                  # Express routers (9 route files)
│       ├── services/                # Business logic (Evaluation, Email, Cache, JobQueue, etc.)
│       ├── middlewares/             # Auth, CORS, Rate Limiting, Upload, Validation
│       ├── socket/                  # Socket.IO event handlers
│       └── utils/                   # ApiError, async wrappers
│
├── agent-service/                   # Python AI Microservice
│   ├── agent/
│   │   ├── nodes/                   # LangGraph nodes (retrieve, generate, format, parse_intent, apply_changes)
│   │   ├── generate_graph.py        # GENERATE subgraph
│   │   ├── refine_graph.py          # REFINE subgraph
│   │   └── state.py                 # TypedDict state schema
│   ├── rag/
│   │   ├── store.py                 # ChromaDB vector store manager
│   │   ├── embedder.py              # Document embedding pipeline
│   │   ├── loader.py                # PDF/DOCX text extraction
│   │   └── chunker.py               # Text splitting (pure Python)
│   ├── prompts/                     # LLM prompt templates
│   ├── routers/                     # Evaluation endpoint
│   ├── session/                     # Session state management
│   ├── config.py                    # Environment configuration
│   ├── llm_factory.py               # LLM fallback chain
│   ├── main.py                      # FastAPI application entry point
│   └── Dockerfile                   # Container configuration
│
├── render.yaml                      # Render deployment config
└── system_architecture.md           # Architecture documentation
```

---

## 🔄 Workflows

### 1. Authentication Flow

```mermaid
flowchart LR
    A[Landing Page] --> B{Auth Method}
    B -->|Email/Password| C[Register with Role]
    B -->|Google OAuth| D[Google ID Token]

    C --> E[BCrypt Hash + Save to MongoDB]
    E --> F[Send Verification Email]
    F --> G[User Clicks Email Link]
    G --> H[Account Verified ✅]

    D --> I[Validate with google-auth-library]
    I --> J{Account Exists?}
    J -->|Yes| K[Auto-detect Role]
    J -->|No| L[Create Account with Selected Role]
    K --> H
    L --> H

    H --> M[Issue JWT Access + Refresh Tokens]
    M --> N{Role?}
    N -->|Teacher| O[Teacher Dashboard]
    N -->|Student| P[Student Dashboard]
```

### 2. Exam Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: Teacher creates exam

    Draft --> Draft: Add/edit/reorder questions
    Draft --> Scheduled: Publish (set start & end time)
    Draft --> [*]: Delete

    Scheduled --> Live: Start time reached (auto-transition)
    Scheduled --> Draft: Cancel

    Live --> Completed: End time reached (auto-transition)
    Live --> Completed: Teacher ends early

    state Live {
        [*] --> StudentTakingExam
        StudentTakingExam --> Autosave: Every 30 seconds
        Autosave --> StudentTakingExam
        StudentTakingExam --> Submitted: Manual submit
        StudentTakingExam --> Submitted: Timer expires (force-submit)
    }

    state Completed {
        [*] --> Evaluating: BullMQ job queued
        Evaluating --> Evaluated: AI grades subjective answers
        Evaluated --> Published: Teacher publishes results
    }
```

### 3. AI Agent Workflow

```mermaid
flowchart TD
    T[Teacher opens AI Generator] --> C[Configure: title, questions, difficulty, materials]
    C --> S[POST /sessions — Create Agent Session]
    S --> G[SSE /sessions/:id/generate/stream]

    subgraph GENERATE["GENERATE Graph (LangGraph)"]
        G1[Retrieve Node] -->|"Search ChromaDB<br/>for relevant chunks"| G2[Generate Node]
        G2 -->|"LLM creates questions<br/>from context"| G3[Format Node]
        G3 -->|"Validate schema"| G4{Valid?}
        G4 -->|No, retry ≤ 3x| G2
        G4 -->|Yes| G5[Return Draft]
    end

    G --> G1
    G5 --> D[Draft appears in Chat UI]

    D --> R[Teacher sends refinement message]
    R --> M[POST /sessions/:id/message]

    subgraph REFINE["REFINE Graph (LangGraph)"]
        R1[Parse Intent Node] -->|"RegEx match?"| R2{Simple Command?}
        R2 -->|"Yes (e.g. change marks)"| R3[Direct State Update<br/>Zero LLM tokens]
        R2 -->|"No (complex request)"| R4[Apply Changes Node<br/>LLM call]
        R3 --> R5[Format Node]
        R4 --> R5
    end

    M --> R1
    R5 --> D

    D --> SAVE[POST /sessions/:id/save]
    SAVE --> EXAM[Creates real Exam in MongoDB]
```

### 4. AI Evaluation Pipeline

```mermaid
flowchart TD
    SUB[Student Submits Exam] --> Q[BullMQ Job Queued]
    Q --> MCQ{Has MCQ Questions?}
    MCQ -->|Yes| SCORE[Score MCQs Natively<br/>Compare selected options]

    Q --> SUBJ{Has Subjective Questions?}
    SUBJ -->|Yes| RAG[Strict-RAG Search]

    RAG --> FILTER{Exam Type?}
    FILTER -->|Manual Exam| F1["Filter ChromaDB by<br/>teacher's material_ids"]
    FILTER -->|AI-Generated Exam| F2["Filter ChromaDB by<br/>exact chunks used during generation"]

    F1 --> CONTEXT[Inject retrieved context into prompt]
    F2 --> CONTEXT

    CONTEXT --> LLM["LLM Evaluates<br/>(Groq → Cerebras → OpenRouter → HF)"]
    LLM --> PARSE{Valid JSON?}
    PARSE -->|Yes| EXTRACT["Extract score + review"]
    PARSE -->|No| FALLBACK[Heuristic Fallback]

    EXTRACT --> AGG[Aggregate Final Grade]
    FALLBACK --> AGG
    SCORE --> AGG

    AGG --> SAVE["Save to MongoDB<br/>Status: evaluated"]
    SAVE --> NOTIFY["Socket.IO: submission-updated"]
```

---

## 📡 API Reference

All routes are prefixed with `/api/v1`. Protected routes require a JWT Bearer token.

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|:---|:---|:---|:---:|
| `POST` | `/register` | Create a new account (student or teacher) | ❌ |
| `POST` | `/login` | Login with username/email + password | ❌ |
| `POST` | `/google-login` | Authenticate via Google OAuth ID token | ❌ |
| `POST` | `/logout` | Invalidate current session | ✅ |
| `POST` | `/refresh-token` | Get new access token using refresh token | ❌ |
| `POST` | `/verify-email` | Confirm email with verification token | ❌ |
| `POST` | `/resend-verification` | Resend email verification link | ✅ |
| `POST` | `/forgot-password` | Send password reset email | ❌ |
| `POST` | `/reset-password` | Reset password using reset token | ❌ |

### Classrooms (`/api/v1/classrooms`)

| Method | Endpoint | Description | Auth |
|:---|:---|:---|:---:|
| `GET` | `/my` | List classrooms for the current user | ✅ |
| `GET` | `/preview/:joinCode` | Preview classroom before joining | ✅ |
| `POST` | `/` | Create a new classroom | 👨‍🏫 |
| `POST` | `/join` | Request to join a classroom | 👨‍🎓 |
| `GET` | `/:id` | Get classroom details | ✅ |
| `POST` | `/:id/approve/:studentId` | Approve a pending student | 👨‍🏫 |
| `POST` | `/:id/reject/:studentId` | Reject a pending student | 👨‍🏫 |
| `POST` | `/:id/materials` | Upload study material (PDF/DOCX) | 👨‍🏫 |
| `DELETE` | `/:id/materials/:materialId` | Delete a material | 👨‍🏫 |
| `POST` | `/:id/materials/:materialId/re-embed` | Re-trigger AI embedding | 👨‍🏫 |
| `GET` | `/:id/materials/:materialId/download` | Get signed download URL | ✅ |
| `PUT` | `/:id/join-code` | Regenerate classroom join code | 👨‍🏫 |
| `POST` | `/:id/leave` | Student leaves a classroom | 👨‍🎓 |
| `DELETE` | `/:id` | Delete classroom entirely | 👨‍🏫 |

### Exams (`/api/v1/exams`)

| Method | Endpoint | Description | Auth |
|:---|:---|:---|:---:|
| `POST` | `/create` | Create a new exam (draft) | 👨‍🏫 |
| `GET` | `/all` | List all exams (filtered by context) | ✅ |
| `GET` | `/my` | List exams created by the teacher | 👨‍🏫 |
| `GET` | `/stats` | Get exam statistics | 👨‍🏫 |
| `GET` | `/search/:code` | Search for an exam by share code | 👨‍🎓 |
| `GET` | `/:id` | Get exam details | ✅ |
| `PUT` | `/:id/update` | Update exam metadata | 👨‍🏫 |
| `DELETE` | `/:id` | Delete an exam | 👨‍🏫 |
| `POST` | `/:id/publish` | Publish exam (draft → scheduled) | 👨‍🏫 |
| `POST` | `/:id/end-now` | End a live exam immediately | 👨‍🏫 |
| `POST` | `/:id/cancel` | Cancel a scheduled exam | 👨‍🏫 |
| `PATCH` | `/:id/extend` | Extend exam end time | 👨‍🏫 |
| `POST` | `/:id/regenerate-code` | Regenerate share code | 👨‍🏫 |
| `PATCH` | `/:id/questions` | Add questions to exam | 👨‍🏫 |
| `PATCH` | `/:id/questions/remove` | Remove questions from exam | 👨‍🏫 |
| `PATCH` | `/:id/questions/set` | Replace entire question set | 👨‍🏫 |
| `PATCH` | `/:id/reorder` | Reorder questions | 👨‍🏫 |
| `POST` | `/:id/questions/create` | Quick create-and-attach question | 👨‍🏫 |
| `POST` | `/:id/duplicate` | Duplicate an exam | 👨‍🏫 |
| `POST` | `/sync-status` | Trigger status sync | 👨‍🏫 |

### Questions (`/api/v1/questions`)

| Method | Endpoint | Description | Auth |
|:---|:---|:---|:---:|
| `POST` | `/create` | Create a question | 👨‍🏫 |
| `POST` | `/bulk` | Bulk create questions | 👨‍🏫 |
| `GET` | `/my` | List teacher's questions (paginated, filterable) | 👨‍🏫 |
| `GET` | `/:id` | Get question by ID | 👨‍🏫 |
| `PUT` | `/:id/update` | Update a question | 👨‍🏫 |
| `DELETE` | `/:id` | Delete a question | 👨‍🏫 |

### Submissions (`/api/v1/submissions`)

| Method | Endpoint | Description | Auth |
|:---|:---|:---|:---:|
| `POST` | `/start` | Start a submission (enter exam) | 👨‍🎓 |
| `POST` | `/start/:id` | Start submission (alt param) | 👨‍🎓 |
| `GET` | `/:id` | Get submission for taking exam | 👨‍🎓 |
| `PATCH` | `/:id/answers` | Sync (autosave) answers | 👨‍🎓 |
| `POST` | `/submit` | Submit exam | 👨‍🎓 |
| `POST` | `/:id/submit` | Submit exam (alt param) | 👨‍🎓 |
| `POST` | `/:id/violation` | Log anti-cheat violation | 👨‍🎓 |
| `GET` | `/my-submissions` | List student's submissions | 👨‍🎓 |
| `GET` | `/results/:id` | Get submission results (student view) | 👨‍🎓 |
| `GET` | `/student` | Get submission by exam + student query | 👨‍🎓 |
| `GET` | `/:id/status` | Poll submission status (lightweight) | ✅ |
| `GET` | `/exam/:id` | List all submissions for an exam | 👨‍🏫 |
| `GET` | `/teacher/:id` | Get submission for grading | 👨‍🏫 |
| `PUT` | `/:id/evaluate` | Manual evaluation update | 👨‍🏫 |
| `POST` | `/:id/evaluate-auto` | Trigger AI evaluation | 👨‍🏫 |
| `PATCH` | `/:id/override` | Override AI grade | 👨‍🏫 |
| `POST` | `/:id/publish` | Publish single result | 👨‍🏫 |
| `POST` | `/exam/:examId/publish-all` | Publish all exam results | 👨‍🏫 |
| `GET` | `/exam/:id/export` | Export submissions to CSV | 👨‍🏫 |

### Issues (`/api/v1/issues`)

| Method | Endpoint | Description | Auth |
|:---|:---|:---|:---:|
| `POST` | `/create` | Create an issue (evaluation dispute) | 👨‍🎓 |
| `GET` | `/student` or `/me` | List student's issues | 👨‍🎓 |
| `GET` | `/all` | List all issues (filterable) | 👨‍🏫 |
| `GET` | `/:id` | Get issue details | ✅ |
| `PATCH` | `/:id/status` | Update issue status | 👨‍🏫 |
| `PATCH` | `/:id/resolve` | Resolve with reply | 👨‍🏫 |
| `POST` | `/:id/notes` | Add internal teacher note | 👨‍🏫 |
| `POST` | `/bulk-resolve` | Bulk resolve issues | 👨‍🏫 |
| `DELETE` | `/:id` | Delete own issue | 👨‍🎓 |

### AI Agent (`/api/v1/agent`)

| Method | Endpoint | Description | Auth |
|:---|:---|:---|:---:|
| `POST` | `/sessions` | Create new AI agent session | 👨‍🏫 |
| `GET` | `/sessions/:sessionId` | Get session state and draft | 👨‍🏫 |
| `GET` | `/sessions/:sessionId/generate/stream` | SSE stream for exam generation | 👨‍🏫 |
| `POST` | `/sessions/:sessionId/message` | Send refinement message to agent | 👨‍🏫 |
| `POST` | `/sessions/:sessionId/save` | Save draft as real exam | 👨‍🏫 |

### User Profiles

**Students** (`/api/v1/students`):
| Method | Endpoint | Description | Auth |
|:---|:---|:---|:---:|
| `GET` | `/profile` | Get profile | 👨‍🎓 |
| `PUT` | `/update` | Update profile | 👨‍🎓 |
| `PUT` | `/change-password` | Change password | 👨‍🎓 |
| `GET` | `/export/profile` | Export profile CSV | 👨‍🎓 |
| `GET` | `/export/submissions` | Export submissions CSV | 👨‍🎓 |

**Teachers** (`/api/v1/teachers`):
| Method | Endpoint | Description | Auth |
|:---|:---|:---|:---:|
| `PUT` | `/update` | Update profile | 👨‍🏫 |
| `PUT` | `/change-password` | Change password | 👨‍🏫 |
| `GET` | `/dashboard-stats` | Get dashboard statistics | 👨‍🏫 |
| `GET` | `/export/profile` | Export profile CSV | 👨‍🏫 |
| `GET` | `/export/exams` | Export exams CSV | 👨‍🏫 |

> **Legend:** ❌ = No auth required &nbsp;|&nbsp; ✅ = Any authenticated user &nbsp;|&nbsp; 👨‍🏫 = Teacher only &nbsp;|&nbsp; 👨‍🎓 = Student only

---

## 🤖 Agent Service Deep Dive

The Agent Service is a standalone Python microservice that powers all AI features. It communicates with the Node.js backend over REST and SSE.

### LLM Fallback Chain

The system tries each provider in priority order. If one fails (rate limit, downtime), it automatically falls back to the next:

```
Groq (llama-3.3-70b) → Cerebras (gpt-oss-120b) → OpenRouter (free tier) → HuggingFace (Qwen2.5-72B)
```

All providers use OpenAI-compatible APIs via `langchain-openai`'s `ChatOpenAI`, making the fallback seamless.

### LangGraph State Graphs

The agent uses two compiled LangGraph `StateGraph` instances:

| Graph | Purpose | Nodes |
|:---|:---|:---|
| **GENERATE** | Create initial exam draft | `retrieve_context` → `generate_exam` → `format_output` |
| **REFINE** | Modify draft based on teacher chat | `parse_intent` → `apply_changes` → `format_output` |

Both graphs include **retry loops** (up to 3x) if the LLM output fails schema validation.

### ChromaDB RAG Pipeline

```
Upload PDF/DOCX → Extract Text (pypdf/python-docx) → Split into 800-char chunks
→ Embed via HuggingFace Inference API (all-MiniLM-L6-v2) → Store in ChromaDB
```

Each classroom gets an isolated ChromaDB collection (`classroom_{id}`). During exam generation, only the relevant classroom's materials are searched.

### Agent API Endpoints

| Endpoint | Method | Description |
|:---|:---|:---|
| `/health` | `GET` | Health check with provider status |
| `/embed` | `POST` | Embed a document into ChromaDB |
| `/embed` | `DELETE` | Remove document embeddings |
| `/sessions` | `POST` | Create a new agent session |
| `/sessions/:id/generate/stream` | `GET` | Stream exam generation via SSE |
| `/sessions/:id/message` | `POST` | Send refinement message (SSE response) |
| `/sessions/:id` | `GET` | Get current session state |
| `/api/v1/ai/evaluate` | `POST` | Evaluate a student answer (strict-RAG) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.0.0 or higher
- **Python** 3.12 or higher
- **MongoDB** — Local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- **API Keys** — At least one LLM provider (Groq, Cerebras, OpenRouter, or HuggingFace)

### 1. Clone the Repository

```bash
git clone https://github.com/Anurag-Basuri/AI-Based-Exam-Evaluation-System.git
cd AI-Based-Exam-Evaluation-System
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/exam-evaluation

# Server
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
ACCESS_TOKEN_SECRET=your-access-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
ACCESS_TOKEN_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
UPSTASH_REDIS_URL=rediss://default:your-token@your-instance.upstash.io:6379

# Email (Gmail example)
SMTP_SERVICE=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="AI Exam System <your-email@gmail.com>"

# Agent Service
AGENT_SERVICE_URL=http://localhost:8001

# AI Evaluation (HuggingFace direct — used for legacy eval)
HF_API_URL=https://router.huggingface.co/v1/chat/completions
HF_API_KEY=hf_your_key
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Start the frontend:
```bash
npm run dev
```

Navigate to `http://localhost:5173`.

### 4. Agent Service Setup

```bash
cd agent-service
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `agent-service/.env`:
```env
# LLM Providers (fill at least one)
GROQ_API_KEY=your-groq-key
CEREBRAS_API_KEY=your-cerebras-key
OPENROUTER_API_KEY=your-openrouter-key
HF_API_KEY=your-hf-key

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_data
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Server
AGENT_SERVICE_PORT=8001
AGENT_SERVICE_HOST=0.0.0.0
NODE_BACKEND_URL=http://localhost:8000
```

Start the agent:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

## 🌍 Deployment

| Service | Platform | URL Pattern |
|:---|:---|:---|
| **Frontend** | Vercel | `https://your-app.vercel.app` |
| **Backend** | Render (Docker) | `https://your-backend.onrender.com` |
| **Agent** | Render (Docker) | `https://your-agent.onrender.com` |

### Environment Variables Reference

Set these in your hosting platform's dashboard:

| Variable | Service | Required |
|:---|:---|:---:|
| `MONGODB_URI` | Backend | ✅ |
| `ACCESS_TOKEN_SECRET` | Backend | ✅ |
| `REFRESH_TOKEN_SECRET` | Backend | ✅ |
| `GOOGLE_CLIENT_ID` | Backend + Frontend | ✅ |
| `CLOUDINARY_*` | Backend | ✅ |
| `UPSTASH_REDIS_*` | Backend | ✅ |
| `AGENT_SERVICE_URL` | Backend | ✅ |
| `FRONTEND_URL` | Backend | ✅ |
| `GROQ_API_KEY` | Agent | ✅ (at least one) |
| `HF_API_KEY` | Agent | ✅ |
| `VITE_API_BASE_URL` | Frontend | ✅ |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | ✅ |

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Code** your changes following the existing patterns
4. **Test** your changes locally (all 3 services)
5. **Push** your branch: `git push origin feature/your-feature-name`
6. **Open** a Pull Request with a clear description

### Code Guidelines

- **Frontend**: Follow the existing Tailwind CSS class patterns. Use React Context for global state.
- **Backend**: Keep controllers thin — business logic belongs in `services/`. Use `ApiError` for consistent error responses.
- **Agent**: Keep LangGraph nodes pure functions. Add new LLM providers to `llm_factory.py`.
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `perf:`).

### Key Files to Know

| Area | File | What It Does |
|:---|:---|:---|
| AI Evaluation | `server/src/services/evaluation.service.js` | Calls the agent's `/evaluate` endpoint |
| Job Queue | `server/src/services/jobQueue.service.js` | BullMQ worker for async evaluation |
| Exam State Machine | `server/src/services/examStatus.service.js` | Manages exam state transitions |
| LLM Fallback | `agent-service/llm_factory.py` | Provider chain with auto-retry |
| Agent Graph | `agent-service/agent/generate_graph.py` | LangGraph GENERATE workflow |
| Vector Store | `agent-service/rag/store.py` | ChromaDB collection management |

---

## 📝 License & Author

**Anurag Basuri** — Platform Architect & Developer

Licensed under the **[ISC License](LICENSE)**.

---

<p align="center">
  Built with the MERN Stack, LangGraph Agents, and ❤️
</p>
