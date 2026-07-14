import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Users, ChevronRight, Loader2, FileText, Layout, X } from 'lucide-react';
import { getTeacherClassrooms, createTeacherClassroom } from '../../services/teacherServices';
import { useToast } from '../../components/ui/Toaster';

export default function TeacherClassrooms() {
	const navigate = useNavigate();
	const { addToast } = useToast();
	const [classrooms, setClassrooms] = useState([]);
	const [loading, setLoading] = useState(true);

	// Create modal state
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newClassName, setNewClassName] = useState('');
	const [newClassDesc, setNewClassDesc] = useState('');
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		fetchClassrooms();
	}, []);

	// Close modal on Escape
	useEffect(() => {
		if (!isCreateOpen) return;
		const handleEsc = e => {
			if (e.key === 'Escape') closeModal();
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [isCreateOpen]);

	const fetchClassrooms = async () => {
		try {
			const data = await getTeacherClassrooms();
			setClassrooms(data);
		} catch (error) {
			addToast(error.message || 'Failed to load classrooms', 'error');
		} finally {
			setLoading(false);
		}
	};

	const closeModal = useCallback(() => {
		setIsCreateOpen(false);
		setNewClassName('');
		setNewClassDesc('');
	}, []);

	const handleCreate = async e => {
		e.preventDefault();
		if (!newClassName.trim()) return;

		setCreating(true);
		try {
			const newClass = await createTeacherClassroom({
				name: newClassName,
				description: newClassDesc,
			});
			addToast('Classroom created successfully!', 'success');
			closeModal();
			navigate(`/teacher/classrooms/${newClass._id}`);
		} catch (error) {
			addToast(error.message || 'Failed to create classroom', 'error');
		} finally {
			setCreating(false);
		}
	};

	if (loading) {
		return (
			<div className="flex h-[calc(100vh-100px)] items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
						<Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
					</div>
					<p className="font-bold text-gray-500 dark:text-gray-400 animate-pulse">Loading classrooms...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 dash-enter">
			{/* Header */}
			<div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<div className="flex items-center gap-3 mb-2 text-indigo-600 dark:text-indigo-400">
						<Layout className="w-5 h-5" />
						<span className="text-sm font-bold uppercase tracking-wider">Workspace</span>
					</div>
					<h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Classrooms</h1>
					<p className="mt-2 text-gray-500 dark:text-gray-400 text-sm max-w-lg">
						Create and manage your digital classrooms, organize study materials, and track student requests in one place.
					</p>
				</div>
				<button
					onClick={() => setIsCreateOpen(true)}
					className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
				>
					<Plus className="h-5 w-5" />
					Create Classroom
				</button>
			</div>

			{classrooms.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50/50 py-24 px-6 text-center dark:border-gray-700 dark:bg-gray-800/20 dash-enter-2">
					<div className="rounded-3xl bg-indigo-50 p-6 dark:bg-indigo-500/10 mb-6 relative group">
						<div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
						<BookOpen className="h-12 w-12 text-indigo-600 dark:text-indigo-400 relative z-10" />
					</div>
					<h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
						No classrooms yet
					</h3>
					<p className="max-w-md text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
						Get started by creating your first classroom to share study materials with your students and track their progress.
					</p>
					<button
						onClick={() => setIsCreateOpen(true)}
						className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-6 py-3 rounded-xl transition-colors"
					>
						+ Create your first classroom
					</button>
				</div>
			) : (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 dash-enter-2">
					{classrooms.map((cls, idx) => (
						<div
							key={cls._id}
							onClick={() => navigate(`/teacher/classrooms/${cls._id}`)}
							className="group relative cursor-pointer overflow-hidden rounded-3xl glass-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 flex flex-col h-full"
							style={{ animationDelay: `${idx * 0.05}s` }}
						>
							<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 transition-opacity group-hover:opacity-100" />
							<div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-2xl"></div>

							<div className="mb-6 flex items-start justify-between relative z-10">
								<div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 p-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all">
									<BookOpen className="h-6 w-6" />
								</div>
								
								<div className="flex flex-col items-end gap-2">
									<span className="flex items-center gap-1.5 rounded-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm">
										<Users className="h-3.5 w-3.5 opacity-70" />
										{cls.studentCount ?? cls.students?.length ?? 0}
									</span>
									{cls.pendingCount > 0 && (
										<span className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 shadow-sm animate-pulse">
											<div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
											{cls.pendingCount} req
										</span>
									)}
								</div>
							</div>

							<div className="flex-1 relative z-10">
								<h3 className="mb-2 truncate text-xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
									{cls.name}
								</h3>
								<p className="mb-6 line-clamp-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
									{cls.description || 'No description provided.'}
								</p>
							</div>

							<div className="flex items-center justify-between border-t border-gray-100/80 pt-5 dark:border-gray-700/80 relative z-10">
								<div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
									<div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/50 px-2.5 py-1 rounded-md">
										<span className="opacity-70">Code:</span>
										<span className="font-mono tracking-wider text-gray-900 dark:text-white">{cls.joinCode}</span>
									</div>
									{(cls.materialCount > 0) && (
										<span className="flex items-center gap-1.5 opacity-80" title={`${cls.materialCount} study materials`}>
											<FileText className="h-3.5 w-3.5" />
											{cls.materialCount}
										</span>
									)}
								</div>
								<div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-transform group-hover:translate-x-1 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20">
									<ChevronRight className="h-4 w-4" />
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Create Modal */}
			{isCreateOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 dark:bg-black/60 p-4 backdrop-blur-md transition-opacity"
					style={{ animation: 'fadeIn 0.2s ease-out' }}
					onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
				>
					<div
						className="w-full max-w-md rounded-3xl glass-panel p-8 shadow-2xl bg-white/90 dark:bg-gray-900/90 relative"
						style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
					>
						<button onClick={closeModal} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors bg-gray-100 dark:bg-gray-800 rounded-full p-1.5">
							<X className="w-5 h-5" />
						</button>
						
						<div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
							<BookOpen className="w-6 h-6" />
						</div>

						<h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Create Classroom</h2>
						<p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
							Set up a new space to share study materials and manage students.
						</p>

						<form onSubmit={handleCreate} className="mt-8 space-y-5">
							<div>
								<label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
									Classroom Name
								</label>
								<input
									type="text"
									required
									autoFocus
									value={newClassName}
									onChange={e => setNewClassName(e.target.value)}
									placeholder="e.g. Physics 101"
									className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm font-bold text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 dark:focus:bg-gray-800"
								/>
							</div>
							<div>
								<label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
									Description (Optional)
								</label>
								<textarea
									rows={3}
									value={newClassDesc}
									onChange={e => setNewClassDesc(e.target.value)}
									placeholder="Briefly describe this classroom..."
									className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 dark:focus:bg-gray-800"
								/>
							</div>

							<div className="mt-8 flex justify-end gap-3 pt-4">
								<button
									type="button"
									onClick={closeModal}
									className="rounded-xl px-6 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={creating || !newClassName.trim()}
									className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 disabled:opacity-50 disabled:pointer-events-none"
								>
									{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
									Create
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
