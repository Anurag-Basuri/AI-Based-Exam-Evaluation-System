import Exam from '../models/exam.model.js';

export async function syncExamStatuses() {
	const now = new Date();

	// Auto-complete exams that have ended
	const resCompleted = await Exam.updateMany(
		{ status: 'active', endTime: { $lte: now } },
		{ $set: { status: 'completed', isActive: false } },
	);

	return { completed: resCompleted.modifiedCount || 0, ranAt: now };
}

export function startExamStatusScheduler({
	intervalMs = 60_000,
	cleanupMs = 60 * 60_000,
	logger = console,
} = {}) {
	// Run once on boot
	syncExamStatuses()
		.then(r => logger?.log?.('[exam-status] initial sync:', r))
		.catch(err => logger?.error?.('[exam-status] initial sync error:', err));

	// Repeat every minute
	const tick = setInterval(() => {
		syncExamStatuses().catch(err => logger?.error?.('[exam-status] sync error:', err));
	}, intervalMs);

	// Periodically clean up orphan drafts (if any)
	const cleanup = setInterval(() => {
		Exam.cleanupOrphanExams().catch(err =>
			logger?.error?.('[exam-status] cleanup error:', err),
		);
	}, cleanupMs);

	return () => {
		clearInterval(tick);
		clearInterval(cleanup);
	};
}
