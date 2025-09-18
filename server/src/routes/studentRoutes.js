import express from 'express';
import { verifyToken, authorize } from '../middlewares/authmiddleware.js';
import * as studentController from '../controllers/studentController.js';

const router = express.Router();

// Apply authentication and authorization to all student routes
router.use(verifyToken, authorize('student'));

// Route to get the student's personalized timetable
router.get('/timetable', studentController.getStudentTimetable);

// ✅ UPDATED: This route now correctly points to the new function to get all of today's exams
router.get('/exams/active', studentController.getTodaysExams);

// Route to start an exam (requires examId in params and accessCode in body)
router.post('/exams/:examId/start', studentController.startExam);

// Route to submit answers for an ongoing exam
router.put('/submissions/:submissionId/submit', studentController.submitExam);

router.get('/submissions/session/:submissionId', studentController.getSubmissionById);

// Route to get the result of a submitted exam
router.get('/results/:submissionId', studentController.getExamResult);

router.get('/results', studentController.getStudentResults);

export default router;
