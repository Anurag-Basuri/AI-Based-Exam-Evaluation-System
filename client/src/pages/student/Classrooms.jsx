import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogIn, Users, ChevronRight, Loader2, Clock, FileText } from 'lucide-react';
import { getStudentClassrooms, joinStudentClassroom } from '../../services/studentServices';
import { useToast } from '../../components/ui/Toaster';

export default function StudentClassrooms() {
	const navigate = useNavigate();
	const { addToast } = useToast();
	const [classrooms, setClassrooms] = useState([]);
	const [loading, setLoading] = useState(true);

	// Join modal state
	const [isJoinOpen, setIsJoinOpen] = useState(false);
	const [joinCode, setJoinCode] = useState('');
	const [joining, setJoining] = useState(false);

	useEffect(() => {
		fetchClassrooms();
	}, []);

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
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	const enrolledClassrooms = classrooms.filter(c => c.status === 'enrolled' || !c.status);
	const pendingClassrooms = classrooms.filter(c => c.status === 'pending');

	return (
		<div className="mx-auto max-w-6xl p-6">
			<div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Classrooms</h1>
					<p className="mt-1 text-gray-500 dark:text-gray-400">
						Access study materials shared by your teachers
					</p>
				</div>
				<button
					onClick={() => setIsJoinOpen(true)}
					className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-strong hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
				>
					<LogIn className="h-5 w-5" />
					Join Classroom
				</button>
			</div>

			{/* Pending Classrooms */}
			{pendingClassrooms.length > 0 && (
				<div className="mb-8">
					<h2 className="mb-4 flex items-center gap-2 text-base font-bold text-amber-700 dark:text-amber-400">
						<Clock className="h-5 w-5" />
						Pending Approval
						<span className="ml-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-500/30 dark:text-amber-300">
							{pendingClassrooms.length}
						</span>
					</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{pendingClassrooms.map(cls => (
							<div
								key={cls._id}
								className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-500/20 dark:bg-amber-500/5"
							>
								<div className="mb-4 flex items-start justify-between">
									<div className="rounded-xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
										<Clock className="h-6 w-6" />
									</div>
									<span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/30 dark:text-amber-300">
										Pending
									</span>
								</div>
								<h3 className="mb-1 truncate text-xl font-bold text-gray-900 dark:text-white">
									{cls.name}
								</h3>
								{cls.teacher && (
									<p className="mb-3 text-xs font-medium text-amber-700 dark:text-amber-400">
										{cls.teacher.fullname}
									</p>
								)}
								<p className="line-clamp-2 min-h-[2.5rem] text-sm text-gray-600 dark:text-gray-400">
									{cls.description || 'Waiting for the teacher to approve your join request.'}
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Enrolled Classrooms */}
			{enrolledClassrooms.length === 0 && pendingClassrooms.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/50">
					<div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
						<BookOpen className="h-8 w-8 text-gray-400 dark:text-gray-500" />
					</div>
					<h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
						No classrooms yet
					</h3>
					<p className="mt-1 max-w-sm text-center text-gray-500 dark:text-gray-400">
						Join a classroom using the code or invite link provided by your teacher.
					</p>
					<button
						onClick={() => setIsJoinOpen(true)}
						className="mt-6 font-medium text-primary hover:underline"
					>
						Enter Join Code
					</button>
				</div>
			) : enrolledClassrooms.length > 0 && (
				<>
					{pendingClassrooms.length > 0 && (
						<h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">
							Active Classrooms
						</h2>
					)}
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{enrolledClassrooms.map(cls => (
							<div
								key={cls._id}
								onClick={() => navigate(`/student/classrooms/${cls._id}`)}
								className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-primary/40 dark:hover:shadow-primary/5"
							>
								{/* Top accent gradient */}
								<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary-light opacity-0 transition-opacity group-hover:opacity-100" />

								<div className="mb-4 flex items-start justify-between">
									<div className="rounded-xl bg-primary/10 p-3 text-primary">
										<BookOpen className="h-6 w-6" />
									</div>
									<span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
										<Users className="h-3.5 w-3.5" />
										{cls.studentCount ?? cls.students?.length ?? 0}
									</span>
								</div>
								<h3 className="mb-1 truncate text-xl font-bold text-gray-900 dark:text-white">
									{cls.name}
								</h3>
								{cls.teacher && (
									<p className="mb-3 text-xs font-medium text-primary">
										{cls.teacher.fullname}
									</p>
								)}
								<p className="mb-6 line-clamp-2 min-h-[2.5rem] text-sm text-gray-500 dark:text-gray-400">
									{cls.description || 'No description provided.'}
								</p>
								<div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
									<span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
										<FileText className="h-3 w-3" />
										{cls.materialCount ?? cls.materials?.length ?? 0} materials
									</span>
									<div className="flex items-center text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
										View <ChevronRight className="h-4 w-4" />
									</div>
								</div>
							</div>
						))}
					</div>
				</>
			)}

			{/* Join Modal */}
			{isJoinOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
					style={{ animation: 'fadeIn 0.2s ease-out' }}
					onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
				>
					<div
						className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
						style={{ animation: 'scaleIn 0.2s ease-out' }}
					>
						<h2 className="text-xl font-bold text-gray-900 dark:text-white">Join Classroom</h2>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Enter the join code provided by your teacher. Your request will be reviewed for approval.
						</p>

						<form onSubmit={handleJoin} className="mt-6 space-y-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
									Classroom Code
								</label>
								<input
									type="text"
									required
									autoFocus
									value={joinCode}
									onChange={e => setJoinCode(e.target.value.toUpperCase())}
									placeholder="e.g. ABC123XY"
									className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
								/>
							</div>

							<div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
								<button
									type="button"
									onClick={closeModal}
									className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={joining || !joinCode.trim()}
									className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-strong disabled:opacity-50"
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
