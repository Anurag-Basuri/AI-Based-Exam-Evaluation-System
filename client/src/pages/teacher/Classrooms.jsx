import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Users, ChevronRight, Loader2 } from 'lucide-react';
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
			setIsCreateOpen(false);
			navigate(`/teacher/classrooms/${newClass._id}`);
		} catch (error) {
			addToast(error.message || 'Failed to create classroom', 'error');
		} finally {
			setCreating(false);
		}
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl p-6">
			<div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Classrooms</h1>
					<p className="mt-1 text-gray-500 dark:text-gray-400">
						Create and manage your classes and study materials
					</p>
				</div>
				<button
					onClick={() => setIsCreateOpen(true)}
					className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
				>
					<Plus className="h-5 w-5" />
					Create Classroom
				</button>
			</div>

			{classrooms.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/50">
					<div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
						<BookOpen className="h-8 w-8 text-gray-400 dark:text-gray-500" />
					</div>
					<h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
						No classrooms yet
					</h3>
					<p className="mt-1 max-w-sm text-center text-gray-500 dark:text-gray-400">
						Get started by creating your first classroom to share study materials with your
						students.
					</p>
					<button
						onClick={() => setIsCreateOpen(true)}
						className="mt-6 font-medium text-primary hover:underline"
					>
						Create your first classroom
					</button>
				</div>
			) : (
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{classrooms.map(cls => (
						<div
							key={cls._id}
							onClick={() => navigate(`/teacher/classrooms/${cls._id}`)}
							className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-primary/50"
						>
							<div className="mb-4 flex items-start justify-between">
								<div className="rounded-lg bg-primary/10 p-3 text-primary">
									<BookOpen className="h-6 w-6" />
								</div>
								<span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
									<Users className="h-3.5 w-3.5" />
									{cls.studentCount ?? cls.students?.length ?? 0}
								</span>
							</div>
							<h3 className="mb-2 truncate text-xl font-bold text-gray-900 dark:text-white">
								{cls.name}
							</h3>
							<p className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm text-gray-500 dark:text-gray-400">
								{cls.description || 'No description provided.'}
							</p>
							{cls.pendingCount > 0 && (
								<div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
									<span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800 dark:bg-amber-500/30 dark:text-amber-300">
										{cls.pendingCount}
									</span>
									pending request{cls.pendingCount > 1 ? 's' : ''}
								</div>
							)}
							<div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
								<span className="text-xs text-gray-500 dark:text-gray-400">
									Code: <strong className="text-gray-900 dark:text-white">{cls.joinCode}</strong>
								</span>
								<div className="flex items-center text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
									Manage <ChevronRight className="h-4 w-4" />
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Create Modal */}
			{isCreateOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
					<div className="w-full max-w-md scale-100 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800" style={{ animation: 'scaleIn 0.2s ease-out' }}>
						<h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Classroom</h2>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Set up a new space to share study materials.
						</p>

						<form onSubmit={handleCreate} className="mt-6 space-y-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
									Classroom Name
								</label>
								<input
									type="text"
									required
									value={newClassName}
									onChange={e => setNewClassName(e.target.value)}
									placeholder="e.g. Physics 101"
									className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:text-white"
								/>
							</div>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
									Description (Optional)
								</label>
								<textarea
									rows={3}
									value={newClassDesc}
									onChange={e => setNewClassDesc(e.target.value)}
									placeholder="Briefly describe this classroom..."
									className="w-full resize-none rounded-xl border border-gray-300 bg-transparent px-4 py-2.5 text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:text-white"
								/>
							</div>

							<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
								<button
									type="button"
									onClick={() => setIsCreateOpen(false)}
									className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={creating || !newClassName.trim()}
									className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
								>
									{creating && <Loader2 className="h-4 w-4 animate-spin" />}
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
