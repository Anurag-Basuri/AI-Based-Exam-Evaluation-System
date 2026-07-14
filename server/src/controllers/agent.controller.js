import axios from 'axios';
import { AgentSession } from '../models/agentSession.model.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';

export const createAgentSession = async (req, res) => {
	try {
		const { classroomId, config } = req.body;
		const teacherId = req.user.id; // Provided by auth middleware

		// 1. Ask Python service to initialize a session
		const pythonResponse = await axios.post(`${AGENT_SERVICE_URL}/sessions`, {
			classroom_id: classroomId,
			teacher_id: teacherId,
			config: config,
		});

		const sessionId = pythonResponse.data.session_id;

		// 2. Save session reference in our DB
		const session = await AgentSession.create({
			sessionId,
			teacherId,
			classroomId,
			config,
			status: 'active',
		});

		res.status(201).json({
			success: true,
			data: { sessionId },
		});
	} catch (error) {
		console.error('Create Agent Session Error:', error.message);
		res.status(500).json({ success: false, message: 'Failed to create agent session' });
	}
};

// Proxies the SSE stream from Python to the client
export const streamSession = async (req, res) => {
	const { sessionId } = req.params;

	try {
		const response = await axios({
			method: 'get',
			url: `${AGENT_SERVICE_URL}/sessions/${sessionId}/generate/stream`,
			responseType: 'stream',
			timeout: 120000, // 2 minutes for generation
		});

		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');

		response.data.pipe(res);
	} catch (error) {
		console.error('Stream Session Error:', error.message);
		res.status(500).json({ success: false, message: 'Failed to stream agent session' });
	}
};

export const getSessionState = async (req, res) => {
	const { sessionId } = req.params;

	try {
		// Get messages from local DB
		const session = await AgentSession.findOne({ sessionId });
		if (!session) {
			return res.status(404).json({ success: false, message: 'Session not found in DB' });
		}

		// Get latest draft from Python service
		const pythonResponse = await axios.get(`${AGENT_SERVICE_URL}/sessions/${sessionId}`);
		const draft = pythonResponse.data.draft || pythonResponse.data.questions || [];

		res.status(200).json({
			success: true,
			draft: draft,
			messages: session.messages || [],
		});
	} catch (error) {
		console.error('Get Session State Error:', error.message);
		res.status(500).json({ success: false, message: 'Failed to fetch session state' });
	}
};

export const sendMessageToAgent = async (req, res) => {
	const { sessionId } = req.params;
	const { content } = req.body;

	try {
		// Update our DB asynchronously (no need to block)
		AgentSession.findOneAndUpdate(
			{ sessionId },
			{
				$push: { messages: { role: 'teacher', content } },
			},
		).catch(err => console.error('Failed to log teacher message:', err));

		const response = await axios({
			method: 'post',
			url: `${AGENT_SERVICE_URL}/sessions/${sessionId}/message`,
			data: { content },
			responseType: 'stream',
			timeout: 120000, // 2 minutes for refinement
		});

		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');

		response.data.pipe(res);
	} catch (error) {
		console.error('Send Message Error:', error.message);
		res.status(500).json({ success: false, message: 'Failed to send message to agent' });
	}
};

export const saveDraftAsExam = async (req, res) => {
	const { sessionId } = req.params;
	const teacherId = req.userDoc?._id || req.user?.id;

	try {
		// 1. Get the final draft from Python
		const pythonResponse = await axios.get(`${AGENT_SERVICE_URL}/sessions/${sessionId}`);
		const draft = pythonResponse.data.draft;

		if (!draft || draft.length === 0) {
			return res.status(400).json({ success: false, message: 'No draft questions found' });
		}

		// 2. Get the session details from our DB
		const session = await AgentSession.findOne({ sessionId });
		if (!session) {
			return res.status(404).json({ success: false, message: 'Session not found in DB' });
		}

		// 3. Enforce question limits
		const LIMITS = { total: 30, mcq: 30, subjective: 10 };
		const mcqQuestions = draft.filter(q => q.type === 'multiple-choice');
		const subQuestions = draft.filter(q => q.type === 'subjective');

		if (draft.length > LIMITS.total) {
			return res.status(400).json({ success: false, message: `Maximum ${LIMITS.total} questions allowed (got ${draft.length})` });
		}
		if (mcqQuestions.length > LIMITS.mcq) {
			return res.status(400).json({ success: false, message: `Maximum ${LIMITS.mcq} MCQs allowed (got ${mcqQuestions.length})` });
		}
		if (subQuestions.length > LIMITS.subjective) {
			return res.status(400).json({ success: false, message: `Maximum ${LIMITS.subjective} subjective questions allowed (got ${subQuestions.length})` });
		}

		// 4. Create the questions with proper field names and normalization
		let totalMarks = 0;
		const questionIds = [];

		for (const q of draft) {
			const marks = q.max_marks || q.marks || (q.type === 'multiple-choice'
				? (session.config?.marksPerMcq || 1)
				: (session.config?.marksPerSubjective || 5));
			totalMarks += marks;

			// Normalize MCQ options: ensure isCorrect field exists
			let options = [];
			if (q.type === 'multiple-choice' && Array.isArray(q.options)) {
				options = q.options.map(opt => ({
					text: opt.text || opt.option || opt.label || String(opt),
					isCorrect: !!(opt.isCorrect ?? opt.is_correct ?? opt.correct ?? false),
				}));
				// Ensure at least one correct option
				if (!options.some(o => o.isCorrect) && options.length > 0) {
					options[0].isCorrect = true;
				}
			}

			const newQuestion = await Question.create({
				type: q.type,
				text: q.text || q.question || 'Untitled Question',
				max_marks: marks,
				options,
				answer: q.type === 'subjective' ? (q.answer || q.model_answer || null) : null,
				difficulty: q.difficulty || 'medium',
				tags: Array.isArray(q.tags) ? q.tags : [],
				createdBy: teacherId,
			});
			questionIds.push(newQuestion._id);
		}

		// 5. Create the Exam with defensive startTime
		const now = Date.now();
		const startTime = new Date(now + 24 * 60 * 60 * 1000);
		const endTime = new Date(now + 48 * 60 * 60 * 1000);

		const newExam = await Exam.create({
			title: session.config?.title || 'AI Generated Exam',
			description: session.config?.description || 'Generated by Agentic AI',
			createdBy: teacherId,
			duration: session.config?.duration || 60,
			questions: questionIds,
			startTime,
			endTime,
			status: 'draft',
			totalMarks,
			generatedBy: 'ai',
			agentSessionId: sessionId,
		});

		// 6. Link questions to the exam
		await Question.updateMany(
			{ _id: { $in: questionIds } },
			{ $set: { sourceExam: newExam._id } }
		);

		// 7. Mark session as completed
		session.status = 'completed';
		await session.save();

		res.status(201).json({
			success: true,
			data: newExam,
		});
	} catch (error) {
		console.error('Save Draft Error:', error.message, error.stack);
		res.status(500).json({ success: false, message: `Failed to save draft as exam: ${error.message}` });
	}
};
