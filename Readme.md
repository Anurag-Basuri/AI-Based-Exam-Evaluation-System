# AI-Based Exam Evaluation System

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js CI](https://github.com/your-username/your-repo/actions/workflows/node.js.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/node.js.yml)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=nodedotjs)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4-lightgrey?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-green?logo=mongodb)](https://www.mongodb.com/)

A modern, full-stack MERN application designed to streamline the entire examination process—from creation and delivery to automated evaluation and issue resolution. This system provides a seamless digital experience for both teachers and students.

## Why This Project?

Traditional exam management is often manual, time-consuming, and prone to inconsistencies. This project addresses these challenges by offering a centralized platform that automates key tasks, ensures consistent grading, and provides a real-time, interactive environment for all users. It's an ideal solution for educational institutions and training organizations looking to modernize their assessment workflows.

---

## Core Features

### Student Experience
- **Secure Authentication:** Simple registration and login with JWT-based session management.
- **Dashboard:** A personalized portal to view available exams, recent results, and pending actions.
- **Exam Taking:** A distraction-free interface for taking exams, with automatic saving of answers to prevent data loss.
- **View Results:** Instant access to graded submissions, including scores and teacher feedback.
- **Support System:** Raise issues related to exams or evaluations and track their status in real-time.

### Teacher & Admin Experience
- **Exam Management:** A powerful editor to create, manage, and publish exams with various question types (MCQ, Subjective).
- **Submission Monitoring:** Track student submissions in real-time as they happen.
- **AI-Assisted Grading:** Leverage automated scoring for objective questions and review subjective answers efficiently.
- **Issue Resolution:** A dedicated dashboard to view, manage, and respond to student-raised issues.
- **Real-time Notifications:** Receive instant updates for new submissions and issues via WebSockets.

### Platform & Technology
- **Real-Time Communication:** Uses **Socket.IO** for instant updates on issue statuses, new submissions, and notifications.
- **RESTful API:** A well-structured and secure backend API built with Node.js and Express.
- **Input Validation:** Ensures data integrity with `express-validator` on all critical API routes.
- **Responsive Design:** A clean, modern UI built with React that works seamlessly across devices.
- **Role-Based Access Control:** Secure middleware ensures students and teachers can only access authorized resources.

---

## Technology Stack

- **Frontend:** React 18, Vite, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Real-time Engine:** Socket.IO
- **Authentication:** JSON Web Tokens (JWT)
- **Styling:** CSS-in-JS (Inline Styles) & Global CSS

---

## High-Level Flow

```mermaid
flowchart TD
    A[User Visits App] --> B{Login / Register}
    B -->|JWT Issued| C[Authenticated Dashboard]

    subgraph Student Flow
      C --> S1[Views Exams]
      S1 --> S2[Starts Exam]
      S2 --> S3[Answers Questions (Autosave)]
      S3 --> S4[Submits Exam]
      S4 --> S5[Views Results]
      S5 --> S6[Raises Support Issue]
    end

    subgraph Teacher Flow
      C --> T1[Creates/Manages Exams]
      T1 --> T2[Monitors Submissions]
      T2 --> T3[Grades Submissions]
      T3 --> T4[Resolves Issues]
    end

    S6 --> T4
```

---

## API Endpoints Overview

Base URL: `/api`

| Resource   | Method | Endpoint                       | Access    | Description                               |
|------------|--------|--------------------------------|-----------|-------------------------------------------|
| **Student**| POST   | `/students/register`           | Public    | Register a new student account.           |
|            | POST   | `/students/login`              | Public    | Log in and receive JWT tokens.            |
|            | GET    | `/students/profile`            | Student   | Get current student's profile.            |
| **Exam**   | GET    | `/exams/search/:code`          | Student   | Find an exam by its unique code.          |
|            | GET    | `/exams/:id`                   | Student   | Get details for a single exam.            |
| **Submission**| POST| `/submissions/start/:examId`   | Student   | Start a new submission for an exam.       |
|            | GET    | `/submissions/my-submissions`  | Student   | Get all submissions for the student.      |
|            | POST   | `/:id/answers`                 | Student   | Save answers for an ongoing submission.   |
|            | POST   | `/:id/submit`                  | Student   | Finalize and submit an exam.              |
| **Issue**  | POST   | `/issues/create`               | Student   | Create a new support issue.               |
|            | GET    | `/issues/student`              | Student   | Get all issues raised by the student.     |
|            | DELETE | `/issues/:id`                  | Student   | Withdraw an open issue.                   |
|            | GET    | `/issues/all`                  | Teacher   | Get all issues (for admin view).          |
|            | PATCH  | `/issues/:id/resolve`          | Teacher   | Mark an issue as resolved with a reply.   |

---

## Project Structure

```
AI-Based-Exam-Evaluation-System/
├─ client/
│  ├─ src/
│  │  ├─ components/  # Reusable UI components
│  │  ├─ context/     # Auth & Theme context
│  │  ├─ hooks/       # Custom hooks (useAuth)
│  │  ├─ pages/       # Main pages for Student/Teacher dashboards
│  │  ├─ routes/      # App routing configuration
│  │  └─ services/    # API call handlers (studentServices)
│  └─ package.json
└─ server/
   ├─ src/
   │  ├─ controllers/ # Route logic
   │  ├─ middlewares/ # Auth, error handling
   │  ├─ models/      # Mongoose schemas
   │  ├─ routes/      # API route definitions
   │  ├─ services/    # Business logic (e.g., evaluation)
   │  ├─ socket/      # Socket.IO connection and event handling
   │  ├─ utils/       # API Error/Response classes
   │  ├─ app.js       # Express app setup
   │  └─ server.js    # Server and DB initialization
   └─ package.json
```

---

## Local Setup and Installation

**Prerequisites:**
- Node.js v18+
- MongoDB (local instance or Atlas connection string)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AI-Based-Exam-Evaluation-System
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server/` directory and add the following variables:
```env
# server/.env
MONGODB_URI=mongodb://localhost:27017/exam-evaluation
JWT_SECRET=your-super-secret-jwt-key
PORT=3003
CORS_ORIGIN=http://localhost:5173
```
Run the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```
Create an optional `.env` file in the `client/` directory to specify the API server URL:
```env
# client/.env
VITE_API_BASE_URL=http://localhost:3003
```
Run the frontend development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## Roadmap

- [ ] Implement rich question types (e.g., code snippets, file uploads).
- [ ] Enhance AI evaluation with more sophisticated rubrics and feedback generation.
- [ ] Add basic proctoring features like tab-switching detection.
- [ ] Introduce email notifications for key events (e.g., issue resolution).
- [ ] Develop bulk import/export functionality for exams and results.

---

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
