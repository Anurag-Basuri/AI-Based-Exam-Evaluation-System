import express from 'express';
import { protect, requireRole } from '../middlewares/auth.middleware.js';
import {
	createAgentSession,
	streamSession,
	sendMessageToAgent,
	saveDraftAsExam,
} from '../controllers/agent.controller.js';

const router = express.Router();

// All agent routes require teacher role
router.use(protect);
router.use(requireRole('teacher'));

// Create a new agent session
router.post('/sessions', createAgentSession);

// Connect to SSE stream for generation
router.get('/sessions/:sessionId/generate/stream', streamSession);

// Send message to refine the draft
router.post('/sessions/:sessionId/message', sendMessageToAgent);

// Save the finalized draft as a real Exam
router.post('/sessions/:sessionId/save', saveDraftAsExam);

export default router;
