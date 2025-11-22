# AI-Based Exam Evaluation System

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)  
[![Node.js CI](https://github.com/your-username/your-repo/actions/workflows/node.js.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/node.js.yml)  
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)  
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=nodedotjs)](https://nodejs.org/)  
[![Express.js](https://img.shields.io/badge/Express.js-4-lightgrey?logo=express)](https://expressjs.com/)  
[![MongoDB](https://img.shields.io/badge/MongoDB-green?logo=mongodb)](https://www.mongodb.com/)

A modern MERN application to create, deliver, autosave, and (partially) auto-evaluate exams. Designed for instructors and students, the system emphasizes reliability (autosave), auditability (submissions & issues), and extensibility (AI evaluation service).

---

## Why this project?

Managing exams manually is error-prone and time-consuming. This project automates core workflows—exam creation, delivery, autosaving, and evaluation—so institutions can run assessments at scale with consistent grading and fewer administrative overheads.

---

## Core features

### Student experience

- JWT-based authentication and secure sessions.
- Dashboard to view and join available exams.
- Distraction-free exam UI with automatic and manual save options.
- Submit exams and view results with per-question feedback.
- Raise and track support issues (real-time updates via Socket.IO).

### Teacher & admin experience

- Create, edit, publish exams with multiple question types (MCQ, subjective).
- Monitor live submissions and student progress.
- AI-assisted grading pipeline for objective questions and to assist subjective review.
- Manage and resolve student issues, with history and replies.

### Platform & technology

- Real-time updates via Socket.IO.
- RESTful API built with Express and Mongoose.
- Input validation using `express-validator`.
- Responsive React UI (Vite).
- Role-based access control and inline styling + CSS.

---

## How it works (high-level)

- Students start exams (server creates a Submission).
- Answers are autosaved periodically; the server persists them into the Submission document.
- When time expires or the student submits, the server finalizes and triggers evaluation.
- Teachers can review, adjust evaluations, and publish results.

---

## Technology stack

- Frontend: React 18, Vite, React Router
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)
- Real-time: Socket.IO
- Auth: JWT
- Styling: Inline styles + global CSS

---

## High-level flow

```mermaid
flowchart TD
    A[Open App] --> B{Login / Register}
    B --> C[Dashboard (Auth)]
    subgraph Student
      C --> S1[Find Exam]
      S1 --> S2[Start Exam (Submission created)]
      S2 --> S3[Answer Questions (Auto-save)]
      S3 --> S4[Submit Exam]
      S4 --> S5[View Results]
      S5 --> S6[Open Issue]
    end
    subgraph Teacher
      C --> T1[Create & Publish Exam]
      T1 --> T2[Monitor Submissions]
      T2 --> T3[Grade / Review]
      T3 --> T4[Resolve Issues]
    end
```

---

## API endpoints (base: /api)

> Note: the active implementation uses PATCH for partial updates (syncing answers). Confirm routes in `server/src/routes`.

| Resource   | Method | Endpoint                      | Access  | Description                              |
| ---------- | ------ | ----------------------------- | ------- | ---------------------------------------- |
| Student    | POST   | `/students/register`          | Public  | Register a student                       |
|            | POST   | `/students/login`             | Public  | Login and receive JWT                    |
|            | GET    | `/students/profile`           | Student | Current student profile                  |
| Exam       | GET    | `/exams/search/:code`         | Student | Find an exam by code                     |
|            | GET    | `/exams/:id`                  | Student | Get exam details                         |
| Submission | POST   | `/submissions/start/:examId`  | Student | Start a new submission / enter exam      |
|            | GET    | `/submissions/my-submissions` | Student | List student's submissions               |
|            | GET    | `/submissions/:id`            | Student | Get a submission (take / resume)         |
|            | PATCH  | `/submissions/:id/answers`    | Student | Sync (autosave) answers (partial update) |
|            | POST   | `/submissions/:id/submit`     | Student | Finalize and submit an exam              |
| Issue      | POST   | `/issues/create`              | Student | Create a support issue                   |
|            | GET    | `/issues/student`             | Student | Get student issues                       |
|            | DELETE | `/issues/:id`                 | Student | Withdraw issue                           |

---

## Project structure

```
AI-Based-Exam-Evaluation-System/
├─ client/
│  ├─ src/
│  │  ├─ pages/          # Student & Teacher views (TakeExam, Exams, Results)
│  │  ├─ services/       # API wrappers (studentServices.js)
│  │  └─ components/     # Reusable UI pieces
└─ server/
   ├─ src/
   │  ├─ controllers/    # Route handlers (submission.controller.js)
   │  ├─ routes/         # Express routes (submission.routes.js)
   │  ├─ models/         # Mongoose schemas
   │  └─ services/       # Business logic (evaluation)
```

---

## Local setup

Requirements: Node.js v18+, MongoDB (local or Atlas)

1. Clone

```bash
git clone <repo-url>
cd AI-Based-Exam-Evaluation-System
```

2. Backend

```bash
cd server
npm install
```

Create `server/.env` with at least:

```env
MONGODB_URI=mongodb://localhost:27017/exam-evaluation
JWT_SECRET=your_jwt_secret
PORT=3003
CORS_ORIGIN=http://localhost:5173
```

Run server:

```bash
npm run dev
```

3. Frontend

```bash
cd ../client
npm install
```

Optional `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3003
```

Run client:

```bash
npm run dev
```

Open: http://localhost:5173

---

## Environment variables (minimal)

- server/.env
  - MONGODB_URI
  - JWT_SECRET
  - PORT (optional, default 3003)
  - CORS_ORIGIN (frontend origin)
- client/.env (optional)
  - VITE_API_BASE_URL (defaults to http://localhost:3003)

---

## Common issues & troubleshooting

- "PATCH /api/submissions/undefined/answers" — submission id is missing on client. Ensure:
  - The TakeExam page fetches a fresh submission from GET /submissions/:id before autosave.
  - The normalizer (`client/src/services/studentServices.js`) retains `id` and `answers` slots.
- Autosave failures — check network, server CORS settings, and that server accepts PATCH on `/submissions/:id/answers`.
- MongoDB errors — confirm `MONGODB_URI` and that the DB is reachable.
- JWT / Auth errors — ensure token is sent in Authorization header: `Bearer <token>`.

---

## Development notes

- Autosave interval and max violations are configurable in the client (TakeExam page).
- Server returns populated submission objects; client code expects normalized shapes (`submission.id`, `questions[].id`, `answers[]`).
- If you change submission schema, update `normalizeSubmission` in `client/src/services/studentServices.js`.

---

## Roadmap (ideas)

- Rich question types: code blocks, file uploads.
- Improved AI rubrics and multi-pass evaluation.
- Basic proctoring (tab-switch detection, webcam hooks).
- Email/notification integration for key events.

---

## Contributing

1. Fork the repo
2. Create a branch per feature/fix
3. Open a PR with tests or manual test steps

Please include logs and reproduction steps for bug fixes.

---

## License

ISC License — see LICENSE file.

---
