import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	ArrowLeft,
	FileText,
	Download,
	Users,
	Loader2,
	BookOpen,
	Image as ImageIcon,
	Video,
	Music,
	FileArchive,
	FileCode,
	FileSpreadsheet,
	LogOut,
} from 'lucide-react';
import { getStudentClassroomById, leaveStudentClassroom } from '../../services/studentServices';
import { useToast } from '../../components/ui/Toaster';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useSocket } from '../../hooks/useSocket.js';
import PageHeader from '../../components/ui/PageHeader.jsx';

const getFileIcon = (filename = '') => {
	const ext = filename.split('.').pop().toLowerCase();
	if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return <ImageIcon className="h-5 w-5" />;
	if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return <Video className="h-5 w-5" />;
	if (['mp3', 'wav', 'flac'].includes(ext)) return <Music className="h-5 w-5" />;
	if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive className="h-5 w-5" />;
	if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json'].includes(ext)) return <FileCode className="h-5 w-5" />;
	if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="h-5 w-5" />;
	return <FileText className="h-5 w-5" />;
};

const getFileExtBadge = (filename = '') => {
	const ext = filename.split('.').pop().toUpperCase();
	return ext.length <= 5 ? ext : 'FILE';
};

export default function StudentClassroomDetails() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { addToast } = useToast();

	const [classroom, setClassroom] = useState(null);
	const [loading, setLoading] = useState(true);
	const [leavingClassroom, setLeavingClassroom] = useState(false);

	const [confirmState, setConfirmState] = useState({
		isOpen: false,
		title: '',
		message: '',
		onConfirm: () => {},
		confirmText: 'Confirm',
		variant: 'danger',
	});

	const { socket } = useSocket();

	useEffect(() => {
		fetchClassroom();
	}, [id]);

	useEffect(() => {
		if (!socket) return;
		
		const room = `classroom-${id}`;
		socket.emit('join', room);

		const handleMaterialsUpdated = (data) => {
			if (data.classroomId === id) {
				addToast('Classroom materials updated', 'info');
				fetchClassroom();
			}
		};

		socket.on('classroom-materials-updated', handleMaterialsUpdated);

		return () => {
			socket.off('classroom-materials-updated', handleMaterialsUpdated);
		};
	}, [socket, id]);

	const fetchClassroom = async () => {
		try {
			const data = await getStudentClassroomById(id);
			setClassroom(data);
		} catch (error) {
			addToast(error.message || 'Failed to load classroom', 'error');
			navigate('/student/classrooms');
		} finally {
			setLoading(false);
		}
	};

	const handleLeaveClassroom = async () => {
		setLeavingClassroom(true);
		try {
			await leaveStudentClassroom(id);
			addToast('You have left the classroom', 'success');
			navigate('/student/classrooms');
		} catch (error) {
			addToast(error.message || 'Failed to leave classroom', 'error');
			setLeavingClassroom(false);
		}
	};

	const requestLeaveClassroom = () => {
		setConfirmState({
			isOpen: true,
			title: 'Leave Classroom',
			message: 'Are you sure you want to leave this classroom? You will lose access to all study materials until you join again.',
			confirmText: 'Leave Classroom',
			variant: 'danger',
			onConfirm: handleLeaveClassroom,
		});
	};

	const formatBytes = (bytes, decimals = 1) => {
		if (!+bytes) return '—';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
			</div>
		);
	}

	if (!classroom) return null;

	const materialCount = classroom.materials?.length || 0;

	return (
		<div className="min-h-screen bg-[var(--bg)] pb-20 dash-enter">
			<PageHeader
				title={classroom.name}
				subtitle={classroom.description || `Teacher: ${classroom.teacher?.fullname || 'Unknown'}`}
				breadcrumbs={[
					{ label: 'Home', to: '/student' },
					{ label: 'Classrooms', to: '/student/classrooms' },
					{ label: classroom.name }
				]}
				actions={[
					<button
						key="leave"
						onClick={requestLeaveClassroom}
						disabled={leavingClassroom}
						className="flex items-center gap-2 rounded-xl border border-red-200/50 bg-red-50/50 px-5 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 active:scale-95"
					>
						{leavingClassroom ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
						Leave Classroom
					</button>
				]}
			/>

			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8">
				<div className="grid gap-8 lg:grid-cols-3">
					{/* Materials Section */}
					<div className="lg:col-span-2 space-y-6">
						<div className="glass-card rounded-3xl p-6 md:p-8">
							<div className="mb-6 flex items-center justify-between">
								<h2 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
									<BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Study Materials
								</h2>
								{materialCount > 0 && (
									<span className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
										{materialCount} Files
									</span>
								)}
							</div>

							{materialCount === 0 ? (
								<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] py-16">
									<div className="mb-4 rounded-full bg-[var(--bg-secondary)] p-4">
										<FileText className="h-10 w-10 text-[var(--text-muted)] opacity-50" />
									</div>
									<p className="text-lg font-bold text-[var(--text)]">
										No materials available yet
									</p>
									<p className="mt-2 text-sm text-[var(--text-muted)] font-medium text-center max-w-sm">
										Check back later when your teacher uploads files.
									</p>
								</div>
							) : (
								<div className="grid gap-4">
									{classroom.materials.map(mat => (
										<div
											key={mat._id}
											className="group flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-indigo-500/50"
										>
											<div className="flex items-center gap-4 min-w-0">
												<div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
													{getFileIcon(mat.originalName)}
													<span className="absolute -bottom-1.5 -right-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] font-black uppercase leading-none text-[var(--text)] shadow-sm">
														{getFileExtBadge(mat.originalName)}
													</span>
												</div>
												<div className="min-w-0">
													<h4 className="truncate text-base font-bold text-[var(--text)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={mat.title || mat.originalName}>
														{mat.title || mat.originalName}
													</h4>
													<div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[var(--text-muted)] font-medium">
														<span className="rounded-md bg-[var(--bg-secondary)] px-2 py-0.5 font-bold">{formatBytes(mat.size)}</span>
														<span>•</span>
														<span>
															{new Date(mat.uploadedAt).toLocaleDateString()}
														</span>
													</div>
												</div>
											</div>
											<a
												href={mat.fileUrl}
												target="_blank"
												rel="noopener noreferrer"
												download
												className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-all hover:bg-indigo-600 hover:text-white hover:scale-105 active:scale-95"
												title="Download Material"
											>
												<Download className="h-4 w-4" />
											</a>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Sidebar (Students list) */}
					<div className="lg:col-span-1 space-y-6">
						<div className="glass-card rounded-3xl p-6">
							<div className="mb-6 flex items-center justify-between">
								<h3 className="text-lg font-black text-[var(--text)] flex items-center gap-2">
									<Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
									Classmates
								</h3>
								<span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
									{classroom.students?.length || 0}
								</span>
							</div>

							{classroom.students?.length === 0 ? (
								<div className="py-6 text-center">
									<p className="text-sm font-medium text-[var(--text-muted)]">
										You are the first student in this classroom!
									</p>
								</div>
							) : (
								<ul className="max-h-[400px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
									{classroom.students.map(student => (
										<li
											key={student._id}
											className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border)]"
										>
											<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-sm font-black text-indigo-600 dark:text-indigo-400">
												{student.fullname?.charAt(0).toUpperCase() || '?'}
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-bold text-[var(--text)]">
													{student.fullname}
												</p>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</div>
			</div>

			<ConfirmModal
				{...confirmState}
				onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
			/>
		</div>
	);
}
