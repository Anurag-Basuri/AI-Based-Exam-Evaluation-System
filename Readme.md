# AI-Based Exam Evaluation System

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)  
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)  
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=nodedotjs)](https://nodejs.org/)  
[![Express.js](https://img.shields.io/badge/Express.js-4-lightgrey?logo=express)](https://expressjs.com/)  
[![MongoDB](https://img.shields.io/badge/MongoDB-green?logo=mongodb)](https://www.mongodb.com/)

A modern MERN (MongoDB, Express, React, Node) application to create, deliver, autosave, and partially auto-evaluate exams. Built for instructors and students with emphasis on reliability (autosave), auditability (submissions & issues), and extensibility (AI evaluation service).

---

## Why this project?

This project reduces manual effort in creating and grading exams, providing:

- Reliable autosave to prevent data loss
- Consistent, auditable submission records
- Extensible evaluation pipeline with hooks for AI-assisted grading
- Real-time support/issue reporting for students

---

## Core features

### Student experience

- Secure authentication (JWT) and session handling.
- Dashboard to browse and join exams.
- Focused exam UI with autosave and manual save.
- Submit exams and view per-question feedback.
- Report issues and follow their resolution (Socket.IO real-time updates).

### Teacher & admin experience

- Create/edit/publish exams (MCQ and subjective).
- Monitor student progress in real time.
- AI-assisted grading pipeline to speed subjective review.
- Issue management and response history.

### Platform & technology

- Real-time via Socket.IO
- REST API with Express + Mongoose
- Input validation with express-validator
- Frontend: React + Vite, React Router
- Role-based access control
- Simple inline styling and global CSS for quick customization

---

## How it works (high level)

1. Student starts an exam → server creates a Submission.
2. Student answers are autosaved periodically to that Submission.
3. On submit or time expiry the server finalizes and triggers evaluation.
4. Teachers can review, adjust scores, and publish results.

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

> Implementation uses PATCH for partial updates (syncing answers). Confirm current server routes under `server/src/routes`.

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
├─ Readme.md
├─ client/
│  ├─ .env
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ index.html
│  ├─ public/
│  │  ├─ index.html
│  │  ├─ manifest.json
│  │  └─ robots.txt
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx
│     ├─ App.css
│     ├─ index.css
│     ├─ assets/
│     ├─ components/
│     │  ├─ ErrorBoundary.jsx
│     │  ├─ Header.jsx
│     │  ├─ Login.jsx
│     │  ├─ Register.jsx
│     │  ├─ RouteFallback.jsx
│     │  └─ Sidebar.jsx
│     ├─ context/
│     │  ├─ AuthContext.jsx
│     │  └─ ThemeContext.jsx
│     ├─ hooks/
│     │  ├─ useAuth.js
│     │  └─ useTheme.js
│     ├─ pages/
│     │  ├─ auth.jsx
│     │  ├─ LandingPage.jsx
│     │  ├─ StudentDash.jsx
│     │  ├─ TeacherDash.jsx
│     │  ├─ student/
│     │  │  ├─ Exams.jsx
│     │  │  ├─ Home.jsx
│     │  │  ├─ issue.jsx
│     │  │  ├─ result.jsx
│     │  │  ├─ Settings.jsx
│     │  │  ├─ TakeExam.jsx
│     │  │  └─ components/ (TakeExamSkeleton.jsx)
│     │  └─ teacher/
│     │     ├─ ExamCreate.jsx
│     │     ├─ ExamEdit.jsx
│     │     ├─ Exams.jsx
│     │     ├─ Home.jsx
│     │     ├─ issue.jsx
│     │     ├─ result.jsx
│     │     ├─ Settings.jsx
│     │     └─ SubmissionGrade.jsx
│     ├─ routes/
│     │  ├─ AppRoutes.jsx
│     │  └─ ProtectedRoutes.jsx
│     ├─ services/
│     │  ├─ api.js
│     │  ├─ apiServices.js
│     │  ├─ studentServices.js
│     │  └─ teacherServices.js
│     └─ utils/
│        └─ handleToken.js
└─ server/
   ├─ .env
   ├─ package.json
   └─ src/
      ├─ app.js
      ├─ db.js
      ├─ server.js
      ├─ controllers/
      │  ├─ exam.controller.js
      │  ├─ issue.controller.js
      │  ├─ question.controller.js
      │  ├─ student.controller.js
      │  ├─ submission.controller.js
      │  └─ teacher.controller.js
      ├─ middlewares/
      │  ├─ auth.middleware.js
      │  └─ cors.middleware.js
      ├─ models/
      │  ├─ exam.model.js
      │  ├─ issue.model.js
      │  ├─ question.model.js
      │  ├─ student.model.js
      │  ├─ submission.model.js
      │  └─ teacher.model.js
      ├─ routes/
      │  ├─ exam.routes.js
      │  ├─ issue.routes.js
      │  ├─ question.routes.js
      │  ├─ student.routes.js
      │  ├─ submission.routes.js
      │  └─ teacher.routes.js
      ├─ services/
      │  ├─ evaluation.service.js
      │  └─ examStatus.service.js
      ├─ socket/
      │  └─ initSocket.js
      └─ utils/
         ├─ ApiError.js
         ├─ ApiResponse.js
         └─ asyncHandler.js
```

---

## Local setup

Requirements: Node.js v18+, MongoDB (local or Atlas). Example commands for Windows PowerShell / cmd.

1. Clone

```bash
git clone <repo-url>
cd AI-Based-Exam-Evaluation-System
```

2. Backend

```powershell
cd server
npm install
# Create server/.env with required variables (see below)
npm run dev
```

3. Frontend

```powershell
cd ../client
npm install
# (Optional) create client/.env if you need non-default API base
npm run dev
```

Open the frontend (Vite) app, usually at http://localhost:5173

---

## Environment variables (minimum)

- server/.env
  - MONGODB_URI (e.g. mongodb://localhost:27017/exam-evaluation)
  - JWT_SECRET
  - PORT (optional, default 3003)
  - CORS_ORIGIN (frontend origin, e.g. http://localhost:5173)
- client/.env (optional)
  - VITE_API_BASE_URL (defaults to http://localhost:3003)

---

## Common issues & troubleshooting

- PATCH /api/submissions/undefined/answers
  - Cause: submission id is missing on the client. Fixes:
    - Ensure TakeExam fetches a fresh submission via GET /submissions/:id on mount.
    - Ensure `normalizeSubmission` (client/src/services/studentServices.js) always sets `id: String(s._id ?? s.id)`.
    - Verify the client uses `submission.id` (not `_id`) when calling save/submit.
- Answers not persisted after submit
  - Cause: server merge logic replacing sub-docs or not preserving sub-doc \_id.
    - Ensure `mergeAnswers` updates existing answer sub-docs in-place and `submission.save()` is called.
    - Server should return a populated submission (exam/questions) or client must re-normalize response.
- Autosave failures
  - Confirm server accepts PATCH on `/submissions/:id/answers`.
  - Check network tab and Authorization header: `Bearer <token>`.
  - Ensure debounce/save closure uses latest submission state (use useRef in React).
- Database / Mongoose errors
  - Verify `MONGODB_URI` and DB connection in server logs.
- Auth / 401
  - Confirm client sends JWT in Authorization header and token is valid.

---

## Development notes

- Autosave interval and max-violations are configurable in client (TakeExam component).
- Client expects normalized submission object:
  - `submission.id`, `questions[].id`, `answers[]` with `question` referencing question id.
- If schema changes, update `normalizeSubmission` in `client/src/services/studentServices.js` and server response/population accordingly.

---

## Roadmap (ideas)

- Add rich question types: code editor, file uploads.
- Improve AI rubrics, multi-pass grading and reviewer workflows.
- Basic proctoring features (tab switch detection, webcam hooks).
- Notification/email integration for result/publish events.

---

## Contributing

1. Fork the repo
2. Create a branch per feature/fix
3. Open a PR with clear reproduction steps and logs for bug fixes

Please include tests or manual test steps where possible.

---

## License

ISC License — see LICENSE file.

---
