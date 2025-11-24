import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
import './TakeExam.css';

const TakeExam = () => {
	const { id } = useParams();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
	// ensure id comparison uses strings
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

	const handleAcknowledgeViolation = () => {
		setViolationOverlay(null);
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch(() => {});
		}
	};

	// Keyboard shortcut: Ctrl/Cmd + Enter to open submit confirmation
	useEffect(() => {
		const onKey = e => {
			const mod = e.ctrlKey || e.metaKey;
			if (mod && e.key === 'Enter') {
				e.preventDefault();
				if (!autoSubmitting) setShowSubmitConfirm(true);
			}
			// quick navigation support: Arrow keys
			if (e.key === 'ArrowLeft') handlePrev();
			if (e.key === 'ArrowRight') handleNext();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [handleNext, handlePrev, autoSubmitting, setShowSubmitConfirm]);

	// --- Render ---
	if (loading) return <TakeExamSkeleton />;
	if (error)
		return (
			<div
				className="exam-container"
				style={{ alignItems: 'center', justifyContent: 'center' }}
			>
				Error: {error}
			</div>
		);
	if (!submission)
		return (
			<div
				className="exam-container"
				style={{ alignItems: 'center', justifyContent: 'center' }}
			>
				Submission not found.
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
		<ExamLayout>
			{violationOverlay && (
				<ViolationOverlay
					type={violationOverlay}
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
			/>

			<div className="exam-main">
				<div className="exam-content">
					{currentQuestion && (
						<QuestionArea
							question={currentQuestion}
							index={currentQuestionIndex}
							answer={currentAnswer}
							onAnswerChange={handleAnswerChange}
							disabled={autoSubmitting}
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
				onPrev={handlePrev}
				onNext={handleNext}
				onReview={toggleReview}
				onSubmit={() => setShowSubmitConfirm(true)}
				isFirst={currentQuestionIndex === 0}
				isLast={currentQuestionIndex === submission.questions.length - 1}
				isReviewing={isReviewing}
				disabled={autoSubmitting}
				saving={saving}
				autoSubmitting={autoSubmitting}
			/>
		</ExamLayout>
	);
};

export default TakeExam;
