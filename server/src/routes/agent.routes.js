import express from 'express';
import { checkAuth, verifyTeacher } from '../middlewares/auth.middleware.js';
import {
	createAgentSession,
	streamSession,
	sendMessageToAgent,
	saveDraftAsExam,
	getSessionState,
} from '../controllers/agent.controller.js';

const router = express.Router();

// All agent routes require teacher role
router.use(checkAuth);
router.use(verifyTeacher);

// Create a new agent session
router.post('/sessions', createAgentSession);

// Get session state (draft and messages)
router.get('/sessions/:sessionId', getSessionState);

// Connect to SSE stream for generation
router.get('/sessions/:sessionId/generate/stream', streamSession);

// Send message to refine the draft
router.post('/sessions/:sessionId/message', sendMessageToAgent);

// Save the finalized draft as a real Exam
router.post('/sessions/:sessionId/save', saveDraftAsExam);

export default router;
