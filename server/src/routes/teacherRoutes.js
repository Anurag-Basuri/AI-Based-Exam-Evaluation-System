import express from 'express';
import { verifyToken, authorize } from '../middlewares/authmiddleware.js';
import * as teacherController from '../controllers/teacherController.js';

const router = express.Router();

// Apply authentication and authorization for all teacher routes
router.use(verifyToken, authorize('teacher'));

// --- Core Exam and Submission Routes ---

// Create a new exam with questions
router.post('/exams', teacherController.createExamWithQuestions);

// Get all exams created by the logged-in teacher
router.get('/exams', teacherController.getTeacherExams);

// Get all submissions for a specific exam
router.get('/exams/:examId/submissions', teacherController.getExamSubmissions);

// --- AI and Manual Grading Routes ---

// Evaluate a specific answer using AI
router.post('/submissions/evaluate-ai', teacherController.evaluateAnswerWithAI);


// ✅ NEW: Route to get details of a single exam
router.get('/exams/:examId', teacherController.getExamDetails);

// ✅ NEW: Route to delete an exam
router.delete('/exams/:examId', teacherController.deleteExam);


router.post('/exams/:examId/publish-results', teacherController.publishResults);



router.post('/timetable', teacherController.createTimetableEntry);


export default router;
