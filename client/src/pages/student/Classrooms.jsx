import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogIn, Users, ChevronRight, Loader2, Clock, FileText } from 'lucide-react';
import { getStudentClassrooms, joinStudentClassroom } from '../../services/studentServices';
import { useToast } from '../../components/ui/Toaster';
import { useSocket } from '../../hooks/useSocket.js';
import PageHeader from '../../components/ui/PageHeader.jsx';

export default function StudentClassrooms() {
	const navigate = useNavigate();
	const { addToast } = useToast();
	const [classrooms, setClassrooms] = useState([]);
	const [loading, setLoading] = useState(true);

	// Join modal state
	const [isJoinOpen, setIsJoinOpen] = useState(false);
	const [joinCode, setJoinCode] = useState('');
	const [joining, setJoining] = useState(false);

	const { socket } = useSocket();

	useEffect(() => {
		fetchClassrooms();
	}, []);

	useEffect(() => {
		if (!socket) return;
		
		const handleRequestUpdated = (data) => {
			addToast(`Your join request was ${data.status}`, data.status === 'approved' ? 'success' : 'info');
			fetchClassrooms();
		};

		socket.on('classroom-request-updated', handleRequestUpdated);

		return () => {
			socket.off('classroom-request-updated', handleRequestUpdated);
		};
	}, [socket]);

	// Close modal on Escape
	useEffect(() => {
		if (!isJoinOpen) return;
		const handleEsc = e => {
			if (e.key === 'Escape') closeModal();
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [isJoinOpen]);

	const fetchClassrooms = async () => {
		try {
			const data = await getStudentClassrooms();
			setClassrooms(data);
		} catch (error) {
			addToast(error.message || 'Failed to load classrooms', 'error');
		} finally {
			setLoading(false);
		}
	};

	const closeModal = useCallback(() => {
		setIsJoinOpen(false);
		setJoinCode('');
	}, []);

	const handleJoin = async e => {
		e.preventDefault();
		if (!joinCode.trim()) return;

		setJoining(true);
		try {
			await joinStudentClassroom(joinCode);
			addToast('Join request sent! Waiting for teacher approval.', 'success');
			fetchClassrooms();
			closeModal();
		} catch (error) {
			addToast(error.message || 'Failed to send join request.', 'error');
		} finally {
			setJoining(false);
		}
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
			</div>
		);
	}

	const enrolledClassrooms = classrooms.filter(c => c.status === 'enrolled' || !c.status);
	const pendingClassrooms = classrooms.filter(c => c.status === 'pending');

	return (
		<div className="min-h-screen bg-[var(--bg)] pb-20 dash-enter">
			<PageHeader
				title="My Classrooms"
				subtitle="Access study materials shared by your teachers"
				breadcrumbs={[{ label: 'Home', to: '/student' }, { label: 'Classrooms' }]}
				actions={[
					<button
						key="join"
						onClick={() => setIsJoinOpen(true)}
						className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-[0.98]"
					>
						<LogIn className="h-4 w-4" />
						Join Classroom
					</button>,
				]}
			/>

			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
				{/* Pending Classrooms */}
				{pendingClassrooms.length > 0 && (
					<div className="mb-10">
						<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-amber-600 dark:text-amber-400">
							<Clock className="h-5 w-5" />
							Pending Approval
							<span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
								{pendingClassrooms.length}
							</span>
						</h2>
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{pendingClassrooms.map(cls => (
								<div
									key={cls._id}
									className="glass-card rounded-2xl border border-amber-200/50 bg-amber-50/30 p-6 dark:border-amber-500/20 dark:bg-amber-500/5"
								>
									<div className="mb-4 flex items-start justify-between">
										<div className="rounded-xl bg-amber-100/50 p-3 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
											<Clock className="h-6 w-6" />
										</div>
										<span className="rounded-full bg-amber-200/50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/30 dark:text-amber-300 uppercase tracking-wider">
											Pending
										</span>
									</div>
									<h3 className="mb-1 truncate text-xl font-black text-[var(--text)]">
										{cls.name}
									</h3>
									{cls.teacher && (
										<p className="mb-3 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
											{cls.teacher.fullname}
										</p>
									)}
									<p className="line-clamp-2 min-h-[2.5rem] text-sm text-[var(--text-muted)] font-medium leading-relaxed">
										{cls.description || 'Waiting for the teacher to approve your join request.'}
									</p>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Enrolled Classrooms */}
				{enrolledClassrooms.length === 0 && pendingClassrooms.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] py-20">
						<div className="rounded-full bg-[var(--bg-secondary)] p-5">
							<BookOpen className="h-10 w-10 text-[var(--text-muted)] opacity-50" />
						</div>
						<h3 className="mt-6 text-xl font-black text-[var(--text)]">
							No classrooms yet
						</h3>
						<p className="mt-2 max-w-sm text-center text-[var(--text-muted)] font-medium">
							Join a classroom using the code or invite link provided by your teacher.
						</p>
						<button
							onClick={() => setIsJoinOpen(true)}
							className="mt-8 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline bg-indigo-50 dark:bg-indigo-500/10 px-6 py-2.5 rounded-xl transition-all"
						>
							Enter Join Code
						</button>
					</div>
				) : enrolledClassrooms.length > 0 && (
					<>
						{pendingClassrooms.length > 0 && (
							<h2 className="mb-6 text-base font-bold text-[var(--text)]">
								Active Classrooms
							</h2>
						)}
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{enrolledClassrooms.map(cls => (
								<div
									key={cls._id}
									onClick={() => navigate(`/student/classrooms/${cls._id}`)}
									className="group glass-card cursor-pointer rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 border-t-4 border-t-transparent hover:border-t-indigo-500"
								>
									<div className="mb-4 flex items-start justify-between">
										<div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
											<BookOpen className="h-6 w-6" />
										</div>
										<span className="flex items-center gap-1.5 rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
											<Users className="h-3.5 w-3.5" />
											{cls.studentCount ?? cls.students?.length ?? 0}
										</span>
									</div>
									<h3 className="mb-1 truncate text-xl font-black text-[var(--text)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
										{cls.name}
									</h3>
									{cls.teacher && (
										<p className="mb-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
											{cls.teacher.fullname}
										</p>
									)}
									<p className="mb-6 line-clamp-2 min-h-[2.5rem] text-sm text-[var(--text-muted)] font-medium leading-relaxed">
										{cls.description || 'No description provided.'}
									</p>
									<div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-auto">
										<span className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
											<FileText className="h-3.5 w-3.5" />
											{cls.materialCount ?? cls.materials?.length ?? 0} materials
										</span>
										<div className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 transition-transform group-hover:translate-x-1">
											View <ChevronRight className="h-4 w-4 ml-1" />
										</div>
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>

			{/* Join Modal */}
			{isJoinOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
					style={{ animation: 'fadeIn 0.2s ease-out' }}
					onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
				>
					<div
						className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl"
						style={{ animation: 'scaleIn 0.2s ease-out' }}
					>
						<h2 className="text-2xl font-black text-[var(--text)] mb-2">Join Classroom</h2>
						<p className="text-sm text-[var(--text-muted)] font-medium mb-8 leading-relaxed">
							Enter the join code provided by your teacher. Your request will be reviewed for approval.
						</p>

						<form onSubmit={handleJoin} className="space-y-6">
							<div>
								<label className="mb-2 block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
									Classroom Code
								</label>
								<input
									type="text"
									required
									autoFocus
									value={joinCode}
									onChange={e => setJoinCode(e.target.value.toUpperCase())}
									placeholder="e.g. ABC123XY"
									className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3.5 text-center font-mono text-xl font-bold tracking-[0.2em] text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
								/>
							</div>

							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={closeModal}
									className="rounded-xl px-5 py-3 text-sm font-bold text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)]"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={joining || !joinCode.trim()}
									className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
								>
									{joining && <Loader2 className="h-4 w-4 animate-spin" />}
									Request to Join
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
