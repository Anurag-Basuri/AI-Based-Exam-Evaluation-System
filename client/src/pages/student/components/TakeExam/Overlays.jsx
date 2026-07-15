import React from 'react';
import { Smartphone, FileText, Lock, AlertTriangle, ArrowLeft, Play, X, ShieldAlert, Send } from 'lucide-react';

// ── Violation severity messaging ──────────────────────────────────
const getViolationMessage = (type) => {
	const messages = {
		fullscreen:          'You exited fullscreen mode. Please return to fullscreen to continue.',
		'tab-switch':        'You switched tabs or minimized the window. This is not allowed during the exam.',
		'window-blur':       'You navigated away from the exam window.',
		'copy-attempt':      'Copying exam content is not permitted.',
		'paste-attempt':     'Pasting content is not allowed in this area.',
		'devtools-attempt':  'Developer tools access is blocked during exams.',
		'devtools-open':     'Developer tools were detected. Please close them immediately.',
		'screenshot-attempt':'Screenshot attempt was blocked.',
		visibility:          'You switched tabs or minimized the window.',
	};
	return messages[type] || 'A security violation was detected.';
};

const getSeverityLevel = (violationCount) => {
	if (violationCount <= 2) return { level: 'warning', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-500', bar: 'bg-amber-500', icon: 'text-amber-500', label: 'Warning' };
	if (violationCount <= 4) return { level: 'serious', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-500', bar: 'bg-rose-500', icon: 'text-rose-500', label: 'Serious Warning' };
	return { level: 'critical', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-600', bar: 'bg-red-600', icon: 'text-red-600', label: 'Final Warning' };
};

// ═══════════════════════════════════════════════════════════════════
// START SCREEN
// ═══════════════════════════════════════════════════════════════════
export const StartScreen = ({ submission, onStart, showWarning, onDismissWarning }) => {
	if (showWarning) {
		return (
			<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 dash-enter" role="dialog" aria-modal="true">
				<div className="glass-card bg-[var(--surface)] max-w-md w-full rounded-3xl p-8 sm:p-10 text-center shadow-2xl border border-[var(--border)]">
					<div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
						<Smartphone className="w-10 h-10 text-indigo-500" />
					</div>
					<h2 className="text-2xl font-black text-[var(--text)] mb-3">
						Small Screen Detected
					</h2>
					<p className="text-[var(--text-muted)] font-medium leading-relaxed mb-8">
						We strongly recommend using a <strong>laptop or desktop computer</strong>{' '}
						for the best exam experience. Small screens may make it difficult to view
						questions and type answers comfortably.
					</p>
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<button 
							onClick={() => window.history.back()} 
							className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors w-full sm:w-auto"
						>
							<ArrowLeft className="w-4 h-4" />
							Go Back
						</button>
						<button 
							onClick={onDismissWarning} 
							className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95 transition-all w-full sm:w-auto"
						>
							Continue Anyway
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4 sm:p-6 lg:p-8 dash-enter" role="region" aria-label="Start exam">
			<div className="glass-card bg-[var(--surface)] max-w-2xl w-full rounded-3xl p-8 sm:p-12 shadow-2xl border border-[var(--border)] text-center">
				<div className="mb-10">
					<div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
						<FileText className="w-10 h-10 text-indigo-500" />
					</div>
					<h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] mb-2">{submission.examTitle}</h1>
					<p className="text-[var(--text-muted)] font-medium text-lg">
						You are about to begin the exam.
					</p>
				</div>

				<div className="grid grid-cols-3 gap-4 sm:gap-6 py-8 border-y border-[var(--border)] mb-10">
					<div className="flex flex-col items-center">
						<span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Duration</span>
						<strong className="text-xl sm:text-2xl font-black text-[var(--text)]">{submission.duration} <span className="text-sm font-medium">mins</span></strong>
					</div>
					<div className="flex flex-col items-center border-x border-[var(--border)]">
						<span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Questions</span>
						<strong className="text-xl sm:text-2xl font-black text-[var(--text)]">{submission.questions?.length || 0}</strong>
					</div>
					<div className="flex flex-col items-center">
						<span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Total Marks</span>
						<strong className="text-xl sm:text-2xl font-black text-[var(--text)]">
							{(submission.questions || []).reduce(
								(sum, q) => sum + (q.max_marks || 0),
								0,
							)}
						</strong>
					</div>
				</div>

				<div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 text-left mb-10 shadow-sm" role="note" aria-label="Exam rules">
					<h3 className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black mb-4">
						<Lock className="w-5 h-5" />
						Exam Security Rules
					</h3>
					<ul className="space-y-3 text-amber-900 dark:text-amber-200 font-medium text-sm sm:text-base list-disc list-inside">
						<li>The exam <strong>must</strong> be taken in fullscreen mode.</li>
						<li>Switching tabs, minimizing, or navigating away will be logged as violations.</li>
						<li><strong>Copy, paste, and screenshot</strong> are blocked during the exam.</li>
						<li>Developer tools (F12) are disabled.</li>
						<li>After <strong className="text-rose-600 dark:text-rose-400">5 violations</strong>, your exam will be auto-submitted.</li>
						<li>Your answers are auto-saved every 30 seconds.</li>
					</ul>
				</div>

				<button
					onClick={onStart}
					className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all"
					aria-label="Start exam"
				>
					<Play className="w-6 h-6 fill-current" />
					Start Exam
				</button>
			</div>
		</div>
	);
};

// ═══════════════════════════════════════════════════════════════════
// VIOLATION OVERLAY — Escalating severity
// ═══════════════════════════════════════════════════════════════════
export const ViolationOverlay = ({ type, violationCount = 0, maxViolations = 5, onAcknowledge }) => {
	const remaining = Math.max(0, maxViolations - violationCount);
	const severity = getSeverityLevel(violationCount);

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 dash-enter" role="alertdialog" aria-modal="true">
			<div className="glass-card bg-[var(--surface)] max-w-md w-full rounded-3xl p-8 sm:p-10 text-center shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-300">
				
				<div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${severity.bg} ${severity.text} animate-pulse`}>
					<ShieldAlert className="w-10 h-10" />
				</div>

				{/* Severity badge */}
				<div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 ${severity.bg} ${severity.text} border ${severity.border}`}>
					{severity.label}
				</div>

				<h2 className={`text-2xl font-black mb-3 ${severity.text}`}>
					Violation Detected
				</h2>

				<p className="text-[var(--text-muted)] font-medium leading-relaxed mb-8">
					{getViolationMessage(type)}
				</p>

				{/* Violation progress bar */}
				<div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 mb-6">
					<div className="flex justify-between items-center mb-3 text-sm font-bold">
						<span className="text-[var(--text)]">Violations: {violationCount} / {maxViolations}</span>
						<span className={remaining <= 1 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-muted)]'}>
							{remaining} warning{remaining !== 1 ? 's' : ''} remaining
						</span>
					</div>
					<div className="h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
						<div 
							className={`h-full rounded-full transition-all duration-500 ${severity.bar}`}
							style={{ width: `${Math.min(100, (violationCount / maxViolations) * 100)}%` }} 
						/>
					</div>
				</div>

				{remaining <= 1 && (
					<div className="bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 font-bold text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2 justify-center">
						<AlertTriangle className="w-4 h-4" />
						Next violation will auto-submit your exam!
					</div>
				)}

				<button 
					onClick={onAcknowledge} 
					className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-md active:scale-[0.98] transition-all"
				>
					I Understand, Return to Exam
				</button>
			</div>
		</div>
	);
};

// ═══════════════════════════════════════════════════════════════════
// SUBMIT CONFIRMATION
// ═══════════════════════════════════════════════════════════════════
export const SubmitConfirmation = ({ stats, onConfirm, onCancel }) => (
	<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 dash-enter" role="dialog" aria-modal="true">
		<div className="glass-card bg-[var(--surface)] max-w-md w-full rounded-3xl p-8 sm:p-10 shadow-2xl border border-[var(--border)] animate-in zoom-in-95 duration-200 text-center">
			
			<div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
				<Send className="w-10 h-10 text-rose-500" />
			</div>
			
			<h2 className="text-2xl font-black text-[var(--text)] mb-8">Submit Exam?</h2>

			<div className="grid grid-cols-3 gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] p-4 rounded-2xl mb-8">
				<div className="flex flex-col items-center">
					<strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
						{stats.answered}
					</strong>
					<span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">
						Answered
					</span>
				</div>
				<div className="flex flex-col items-center border-x border-[var(--border)]">
					<strong className="text-2xl font-black text-amber-500">
						{stats.review}
					</strong>
					<span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">Marked</span>
				</div>
				<div className="flex flex-col items-center">
					<strong className="text-2xl font-black text-[var(--text-muted)]">
						{stats.unanswered}
					</strong>
					<span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">
						Unanswered
					</span>
				</div>
			</div>

			<p className="text-[var(--text-muted)] font-medium mb-8">
				Are you sure you want to submit? You cannot change your answers after submission.
			</p>

			<div className="flex flex-col sm:flex-row gap-3">
				<button 
					onClick={onCancel} 
					className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-bold border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all"
				>
					Cancel
				</button>
				<button
					onClick={onConfirm}
					className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-95 transition-all"
				>
					Yes, Submit Exam
				</button>
			</div>
		</div>
	</div>
);
