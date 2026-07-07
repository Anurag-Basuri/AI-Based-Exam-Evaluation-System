import { Router } from 'express';
import { globalLimiter } from '../../middlewares/rateLimit.middleware.js';

import studentRouter from '../student.routes.js';
import teacherRouter from '../teacher.routes.js';
import authRouter from '../auth.routes.js';
import examRouter from '../exam.routes.js';
import questionRouter from '../question.routes.js';
import submissionRouter from '../submission.routes.js';
import issueRouter from '../issue.routes.js';
import classroomRouter from '../classroom.routes.js';

const router = Router();

// Global API Rate Limit (200 req/min per IP via Upstash)
router.use(globalLimiter);

// Request ID (for log tracing)
router.use((req, res, next) => {
	req.requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
	res.setHeader('X-Request-Id', req.requestId);
	next();
});

// Slow Request Logging
router.use((req, res, next) => {
	const start = process.hrtime.bigint();
	res.on('finish', () => {
		const ms = Number(process.hrtime.bigint() - start) / 1e6;
		if (ms > 1000) {
			console.warn(`[SLOW_REQUEST] ${req.method} ${req.originalUrl} took ${ms.toFixed(0)}ms`);
		}
	});
	next();
});

// Mount domain routers
router.use('/auth', authRouter);
router.use('/students', studentRouter);
router.use('/teachers', teacherRouter);
router.use('/exams', examRouter);
router.use('/questions', questionRouter);
router.use('/submissions', submissionRouter);
router.use('/issues', issueRouter);
router.use('/classrooms', classroomRouter);

export default router;
