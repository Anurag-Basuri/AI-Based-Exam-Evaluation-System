import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamLogic } from '../../hooks/useExamLogic.js';
import TakeExamSkeleton from './components/TakeExamSkeleton.jsx';
import ExamLayout from './components/TakeExam/ExamLayout.jsx';
import ExamHeader from './components/TakeExam/ExamHeader.jsx';
import ExamSidebar from './components/TakeExam/ExamSidebar.jsx';
import QuestionArea from './components/TakeExam/QuestionArea.jsx';
import ExamFooter from './components/TakeExam/ExamFooter.jsx';
import {
	StartScreen,
	ViolationOverlay,
	SubmitConfirmation,
} from './components/TakeExam/Overlays.jsx';
import { AlertCircle, FileQuestion, RefreshCcw } from 'lucide-react';
// import './TakeExam.css'; // Removed in favor of Tailwind

const TakeExam = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [touchStart, setTouchStart] = useState(null);
	const [touchEnd, setTouchEnd] = useState(null);

	const {
		submission,
		loading,
		error,
		isStarted,
		currentQuestionIndex,
		setCurrentQuestionIndex,
		markedForReview,
		violations,
		violationOverlay,
		setViolationOverlay,
		saving,
		lastSaved,
		isOnline,
		showSubmitConfirm,
		setShowSubmitConfirm,
		showSmallScreenWarning,
		setShowSmallScreenWarning,
		timer,
		handleStartExam,
		handleAnswerChange,
		toggleReview,
		finalSubmit,
		handleQuickSave,
		autoSubmitting,
	} = useExamLogic(id);

	// --- Derived State ---
	const currentQuestion = submission?.questions?.[currentQuestionIndex];
	const currentAnswer = submission?.answers?.find(
		a => String(a.question) === String(currentQuestion?.id),
	);
	const isReviewing = currentQuestion && markedForReview.includes(String(currentQuestion.id));

	const questionStats = useMemo(() => {
		if (!submission) return { answered: 0, review: 0, unanswered: 0, total: 0 };
		const questions = submission.questions || [];
		const answers = submission.answers || [];
		let answeredCount = 0;
		questions.forEach(q => {
			const ans = answers.find(a => String(a.question) === String(q.id));
			if ((ans?.responseText && ans.responseText.trim().length > 0) || ans?.responseOption) {
				answeredCount++;
			}
		});
		return {
			answered: answeredCount,
			review: markedForReview.length,
			unanswered: questions.length - answeredCount,
			total: questions.length,
		};
	}, [submission, markedForReview]);

	// --- Handlers ---
	const handleNext = useCallback(async () => {
		await handleQuickSave();
		if (currentQuestionIndex < (submission?.questions?.length || 0) - 1) {
			setCurrentQuestionIndex(prev => prev + 1);
		}
	}, [
		handleQuickSave,
		currentQuestionIndex,
		submission?.questions?.length,
		setCurrentQuestionIndex,
	]);

	const handlePrev = useCallback(() => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(prev => prev - 1);
		}
	}, [currentQuestionIndex, setCurrentQuestionIndex]);

	const handleNavigate = async index => {
		await handleQuickSave();
		setCurrentQuestionIndex(index);
	};

	// --- Touch Swipe Handlers ---
	const minSwipeDistance = 50;

	const onTouchStart = (e) => {
		setTouchEnd(null);
		setTouchStart(e.targetTouches[0].clientX);
	};

	const onTouchMove = (e) => {
		setTouchEnd(e.targetTouches[0].clientX);
	};

	const onTouchEndHandler = () => {
		if (!touchStart || !touchEnd) return;
		const distance = touchStart - touchEnd;
		const isLeftSwipe = distance > minSwipeDistance;
		const isRightSwipe = distance < -minSwipeDistance;
		if (isLeftSwipe) handleNext();
		if (isRightSwipe) handlePrev();
	};

	const handleAcknowledgeViolation = () => {
		setViolationOverlay(null);
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch(() => {});
		}
	};

	// Keyboard shortcuts
	useEffect(() => {
		const onKey = e => {
			const mod = e.ctrlKey || e.metaKey;
			if (mod && e.key === 'Enter') {
				e.preventDefault();
				if (!autoSubmitting) setShowSubmitConfirm(true);
			}
			const tag = e.target?.tagName;
			const isTyping = tag === 'TEXTAREA' || tag === 'INPUT';
			if (!isTyping) {
				if (e.key === 'ArrowLeft') handlePrev();
				if (e.key === 'ArrowRight') handleNext();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [handleNext, handlePrev, autoSubmitting, setShowSubmitConfirm]);

	// --- Render ---
	if (loading) return <TakeExamSkeleton />;
	
	if (error)
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)] dash-enter">
				<div className="glass-card p-12 flex flex-col items-center max-w-md w-full text-center rounded-3xl border border-rose-200 dark:border-rose-500/20 shadow-xl">
					<div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
						<AlertCircle className="w-10 h-10 text-rose-500" />
					</div>
					<h2 className="text-2xl font-black text-[var(--text)] mb-3">Something went wrong</h2>
					<p className="text-[var(--text-muted)] font-medium mb-8">{error}</p>
					<button 
						className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 w-full justify-center"
						onClick={() => window.location.reload()}
					>
						<RefreshCcw className="w-5 h-5" />
						Try Again
					</button>
				</div>
			</div>
		);

	if (!submission)
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)] dash-enter">
				<div className="glass-card p-12 flex flex-col items-center max-w-md w-full text-center rounded-3xl border border-[var(--border)] shadow-xl">
					<div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
						<FileQuestion className="w-10 h-10 text-indigo-500" />
					</div>
					<h2 className="text-2xl font-black text-[var(--text)] mb-3">Submission Not Found</h2>
					<p className="text-[var(--text-muted)] font-medium mb-8">This exam submission could not be loaded or does not exist.</p>
					<button 
						className="flex items-center gap-2 bg-[var(--surface)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 w-full justify-center"
						onClick={() => navigate('/student/exams')}
					>
						Return to Exams
					</button>
				</div>
			</div>
		);

	if (!isStarted) {
		return (
			<StartScreen
				submission={submission}
				onStart={handleStartExam}
				showWarning={showSmallScreenWarning}
				onDismissWarning={() => setShowSmallScreenWarning(false)}
			/>
		);
	}

	return (
		<ExamLayout violationCount={violations.count}>
			{violationOverlay && (
				<ViolationOverlay
					type={violationOverlay}
					violationCount={violations.count}
					maxViolations={5}
					onAcknowledge={handleAcknowledgeViolation}
				/>
			)}

			{showSubmitConfirm && (
				<SubmitConfirmation
					stats={questionStats}
					onConfirm={() => {
						setShowSubmitConfirm(false);
						finalSubmit(false);
					}}
					onCancel={() => setShowSubmitConfirm(false)}
				/>
			)}

			<ExamHeader
				title={submission.examTitle}
				timer={timer}
				onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
				violations={violations}
				questionStats={questionStats}
			/>

			<div className="flex flex-1 overflow-hidden relative bg-[var(--bg)]">
				{/* Background radial gradient equivalent to .exam-main radial background */}
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />
				
				<div 
					className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 pb-32 sm:pb-24 scroll-smooth relative z-10 custom-scrollbar"
					onTouchStart={onTouchStart}
					onTouchMove={onTouchMove}
					onTouchEnd={onTouchEndHandler}
				>
					{currentQuestion && (
						<QuestionArea
							question={currentQuestion}
							index={currentQuestionIndex}
							answer={currentAnswer}
							onAnswerChange={handleAnswerChange}
							disabled={autoSubmitting}
							totalQuestions={submission.questions.length}
						/>
					)}
				</div>

				<ExamSidebar
					questions={submission.questions}
					answers={submission.answers}
					markedForReview={markedForReview}
					currentIndex={currentQuestionIndex}
					onNavigate={handleNavigate}
					isOpen={isSidebarOpen}
					onClose={() => setIsSidebarOpen(false)}
					isOnline={isOnline}
					lastSaved={lastSaved}
					saving={saving}
					violations={violations}
					onSubmit={() => setShowSubmitConfirm(true)}
				/>
			</div>

			<ExamFooter
				currentIndex={currentQuestionIndex}
				totalQuestions={submission.questions.length}
				onPrev={handlePrev}
				onNext={handleNext}
				onToggleReview={toggleReview}
				isReviewing={isReviewing}
				onSubmit={() => setShowSubmitConfirm(true)}
				disabled={autoSubmitting}
			/>
		</ExamLayout>
	);
};

export default TakeExam;
