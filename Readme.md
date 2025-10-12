# AI‑Based Exam Evaluation System

A full‑stack MERN application to create, deliver, submit, and evaluate exams. Teachers build and publish exams; students take exams with autosave and submit responses; the system supports automated/assisted evaluation and result reviews.

## Why this project?

- Problem: Manual grading is slow, inconsistent, and hard to scale.
- Solution: Streamline exam management with a modern web app, automated checks, and a clean UX for teachers and students.
- Who: Schools, colleges, coaching institutes, training teams, and independent educators.

## Core Features

- Students
  - Register/login, secure profile and password management
  - Take exams (MCQ + subjective) with autosave and submission
  - View results and submit support issues
- Teachers
  - Create/publish exams, manage questions, monitor submissions
  - Review results and handle student issues
- Platform
  - JWT auth across protected routes
  - Clean REST API with validation and normalized errors
  - Responsive UI; accessible components
  - MongoDB with Mongoose models

---

## How it works (end‑to‑end)

1) Authentication
- Register/login → server issues authToken + refreshToken
- Auth middleware protects routes; tokens are verified per request
- Logout clears refresh token on the server

2) Exam lifecycle
- Teacher creates exam (title, questions, timing, marks)
- Exam published → visible under “Available Exams” to students
- Student starts submission → server creates a submission record
- Autosave answers during the exam; final submit locks the attempt

3) Evaluation
- MCQs can be auto‑scored
- Subjective questions can use evaluation.service.js (heuristics/AI-assisted approach)
- Final score and per‑question marks stored with the submission

4) Results and issues
- Students view results and feedback
- Students can open issues (support tickets) linked to exams
- Teachers/ops respond to issues and update statuses

---

## Flowchart (high‑level)

```mermaid
flowchart TD
    A[Student/Teacher visits app] --> B[Login/Register]
    B -->|JWT issued| C[Protected Routes]

    subgraph Student Flow
      C --> S1[View Available Exams]
      S1 --> S2[Start Submission]
      S2 --> S3[Autosave Answers]
      S3 --> S4[Submit Exam]
      S4 --> S5[Evaluation (auto/manual)]
      S5 --> S6[View Results]
      S6 --> S7[Open Issue if needed]
    end

    subgraph Teacher Flow
      C --> T1[Create/Edit Exam]
      T1 --> T2[Publish Exam]
      T2 --> T3[Monitor Submissions]
      T3 --> T4[Review & Finalize Scores]
      T4 --> T5[Respond to Issues]
    end

    S7 --> T5
```

---

## API Overview (students)

Base URL: http://localhost:3003/api

- Auth and profile
  - POST /api/students/register
  - POST /api/students/login
  - POST /api/students/logout        (auth)
  - GET  /api/students/profile       (auth)
  - PUT  /api/students/update        (auth)
  - PUT  /api/students/change-password (auth)

- Exams, Submissions, Issues, Teachers
  - See route files in server/src/routes/*.routes.js for full detail and validations

Client services use error normalization and endpoint fallbacks (client/src/services/studentServices.js).

---

## Frontend Routes (high‑level)

- Public: Landing, Login, Register
- Student dashboard: Home, Exams, Results, Support (Issues), Settings
- Teacher dashboard: Home, Exams, Results, Support (Issues), Settings
- Protected routes are enforced via context and guards

---

## Project Structure (explicit)

```
AI-Based-Exam-Evaluation-System/
├─ server/
│  ├─ src/
│  │  ├─ app.js
│  │  ├─ db.js
│  │  ├─ server.js
│  │  ├─ controllers/
│  │  │  ├─ exam.controller.js
│  │  │  ├─ issue.controller.js
│  │  │  ├─ question.controller.js
│  │  │  ├─ student.controller.js
│  │  │  ├─ submission.controller.js
│  │  │  └─ teacherController.js
│  │  ├─ middlewares/
│  │  │  ├─ auth.middleware.js
│  │  │  └─ cors.middleware.js
│  │  ├─ models/
│  │  │  ├─ exam.model.js
│  │  │  ├─ issue.model.js
│  │  │  ├─ question.model.js
│  │  │  ├─ student.model.js
│  │  │  ├─ submission.model.js
│  │  │  └─ teacher.model.js
│  │  ├─ routes/
│  │  │  ├─ exam.routes.js
│  │  │  ├─ issue.routes.js
│  │  │  ├─ question.routes.js
│  │  │  ├─ student.routes.js
│  │  │  ├─ submission.routes.js
│  │  │  └─ teacher.routes.js
│  │  ├─ services/
│  │  │  └─ evaluation.service.js
│  │  └─ utils/
│  │     ├─ ApiError.js
│  │     ├─ ApiResponse.js
│  │     └─ asyncHandler.js
│  ├─ .env           # backend env (local)
│  └─ package.json
└─ client/
   ├─ public/
   │  ├─ index.html
   │  ├─ manifest.json
   │  └─ robots.txt
   ├─ src/
   │  ├─ App.css
   │  ├─ App.jsx
   │  ├─ index.css
   │  ├─ main.jsx
   │  ├─ components/
   │  │  ├─ ErrorBoundary.jsx
   │  │  ├─ Header.jsx
   │  │  ├─ Login.jsx
   │  │  ├─ Register.jsx
   │  │  ├─ RouteFallback.jsx
   │  │  └─ Sidebar.jsx
   │  ├─ context/
   │  │  ├─ AuthContext.jsx
   │  │  └─ ThemeContext.jsx
   │  ├─ hooks/
   │  │  ├─ useAuth.js
   │  │  └─ useTheme.js
   │  ├─ pages/
   │  │  ├─ auth.jsx
   │  │  ├─ LandingPage.jsx
   │  │  ├─ StudentDash.jsx
   │  │  ├─ TeacherDash.jsx
   │  │  ├─ student/
   │  │  │  ├─ Exams.jsx
   │  │  │  ├─ Home.jsx
   │  │  │  ├─ issue.jsx
   │  │  │  ├─ result.jsx
   │  │  │  └─ Settings.jsx
   │  │  └─ teacher/
   │  │     ├─ Exams.jsx
   │  │     ├─ Home.jsx
   │  │     ├─ issue.jsx
   │  │     ├─ result.jsx
   │  │     └─ Settings.jsx
   │  ├─ routes/
   │  │  ├─ AppRoutes.jsx
   │  │  └─ ProtectedRoutes.jsx
   │  ├─ services/
   │  │  ├─ api.js
   │  │  ├─ apiServices.js
   │  │  ├─ studentServices.js
   │  │  └─ teacherServices.js
   │  └─ utils/
   │     └─ handleToken.js
   ├─ .env           # frontend env (local)
   └─ package.json
```

---

## Setup and Run

Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

1) Clone
```bash
git clone <repository-url>
cd AI-Based-Exam-Evaluation-System
```

2) Backend
```bash
cd server
npm install
```

Create server/.env:
```env
MONGODB_URI=mongodb://localhost:27017/exam-evaluation
JWT_SECRET=your-super-secret-jwt-key
PORT=3003
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Run:
```bash
npm run dev   # or: npm start
```

3) Frontend
```bash
cd ../client
npm install
```

Optional client/.env (absolute API base):
```env
VITE_API_BASE_URL=http://localhost:3003
```

Run:
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3003

---

## Development Notes

- Auth: Bearer token sent by client; server verifies via middleware
- Error handling: Unified ApiError/ApiResponse on server; normalized errors on client
- CORS: Set CORS_ORIGIN to your frontend URL
- Services: Client endpoints implement fallbacks and normalizers to tolerate minor API differences

---

## Security

- Passwords hashed (bcrypt)
- JWT-based auth; refresh token stored per user for logout/invalidation
- Input validation via express-validator on critical routes

---

## Roadmap (suggested)

- Rich question types (code runner, attachments)
- Advanced AI evaluation/rubrics
- Proctoring features (timeboxing, tab monitoring)
- Bulk import/export of exams and results
- Email notifications

---

## Contributing

1) Fork the repo
2) Create a feature branch
3) Commit with clear messages
4) Open a PR with context and screenshots (for UI work)

## License

ISC License. See LICENSE for details.
