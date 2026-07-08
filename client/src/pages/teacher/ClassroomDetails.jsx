import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	ArrowLeft,
	Upload,
	FileText,
	Trash2,
	Download,
	Users,
	Loader2,
	Copy,
	Check,
	Link2,
	UserCheck,
	UserX,
	Clock,
	BookOpen,
	Share2,
	Image as ImageIcon,
	Video,
	Music,
	FileArchive,
	FileCode,
	FileSpreadsheet,
	RefreshCw
} from 'lucide-react';
import {
	getTeacherClassroomById,
	uploadClassroomMaterial,
	deleteClassroomMaterial,
	approveClassroomStudent,
	rejectClassroomStudent,
	deleteTeacherClassroom,
	resetClassroomJoinCode,
} from '../../services/teacherServices';
import { useToast } from '../../components/ui/Toaster';
import ConfirmModal from '../../components/ui/ConfirmModal';

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

export default function TeacherClassroomDetails() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { addToast } = useToast();
	const fileInputRef = useRef(null);

	const [classroom, setClassroom] = useState(null);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [deletingId, setDeletingId] = useState(null);
	const [deletingClassroom, setDeletingClassroom] = useState(false);
	const [copiedCode, setCopiedCode] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);
	const [approvingId, setApprovingId] = useState(null);
	const [rejectingId, setRejectingId] = useState(null);
	const [resettingCode, setResettingCode] = useState(false);

	const [confirmState, setConfirmState] = useState({
		isOpen: false,
		title: '',
		message: '',
		onConfirm: () => {},
		confirmText: 'Confirm',
		variant: 'danger',
	});

	useEffect(() => {
		fetchClassroom();
	}, [id]);

	const fetchClassroom = async () => {
		try {
			const data = await getTeacherClassroomById(id);
			setClassroom(data);
		} catch (error) {
			addToast(error.message || 'Failed to load classroom', 'error');
			navigate('/teacher/classrooms');
		} finally {
			setLoading(false);
		}
	};

	const inviteLink = classroom?.joinCode
		? `${window.location.origin}/join/${classroom.joinCode}`
		: '';

	const handleCopyCode = () => {
		if (classroom?.joinCode) {
			navigator.clipboard.writeText(classroom.joinCode);
			setCopiedCode(true);
			setTimeout(() => setCopiedCode(false), 2000);
			addToast('Join code copied!', 'success');
		}
	};

	const handleCopyLink = () => {
		if (inviteLink) {
			navigator.clipboard.writeText(inviteLink);
			setCopiedLink(true);
			setTimeout(() => setCopiedLink(false), 2000);
			addToast('Invite link copied!', 'success');
		}
	};

	const handleFileSelect = async e => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > 10 * 1024 * 1024) {
			addToast('File size must be less than 10MB', 'error');
			return;
		}

		setUploading(true);
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('title', file.name.split('.')[0]);

			const updatedClassroom = await uploadClassroomMaterial(id, formData);
			setClassroom(updatedClassroom);
			addToast('Material uploaded successfully', 'success');
		} catch (error) {
			addToast(error.message || 'Upload failed', 'error');
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	const handleDeleteMaterial = async materialId => {
		setDeletingId(materialId);
		try {
			await deleteClassroomMaterial(id, materialId);
			setClassroom(prev => ({
				...prev,
				materials: prev.materials.filter(m => m._id !== materialId),
			}));
			addToast('Material deleted', 'success');
		} catch (error) {
			addToast(error.message || 'Failed to delete material', 'error');
		} finally {
			setDeletingId(null);
		}
	};

	const requestDeleteMaterial = materialId => {
		setConfirmState({
			isOpen: true,
			title: 'Delete Material',
			message: 'Are you sure you want to delete this material? This action cannot be undone.',
			confirmText: 'Delete',
			variant: 'danger',
			onConfirm: () => handleDeleteMaterial(materialId),
		});
	};

	const handleResetJoinCode = async () => {
		setResettingCode(true);
		try {
			const resData = await resetClassroomJoinCode(id);
			if (resData?.joinCode) {
				setClassroom(prev => ({ ...prev, joinCode: resData.joinCode }));
				addToast('Join code regenerated successfully', 'success');
			}
		} catch (error) {
			addToast(error.message || 'Failed to regenerate join code', 'error');
		} finally {
			setResettingCode(false);
		}
	};

	const requestResetJoinCode = () => {
		setConfirmState({
			isOpen: true,
			title: 'Regenerate Join Code',
			message: 'Are you sure you want to generate a new join code? The old code and invite links will stop working for new students.',
			confirmText: 'Regenerate',
			variant: 'primary',
			onConfirm: handleResetJoinCode,
		});
	};

	const handleDeleteClassroom = async () => {
		setDeletingClassroom(true);
		try {
			await deleteTeacherClassroom(id);
			addToast('Classroom deleted successfully', 'success');
			navigate('/teacher/classrooms');
		} catch (error) {
			addToast(error.message || 'Failed to delete classroom', 'error');
			setDeletingClassroom(false);
		}
	};

	const requestDeleteClassroom = () => {
		setConfirmState({
			isOpen: true,
			title: 'Delete Classroom',
			message: 'Are you sure you want to delete this classroom? This action cannot be undone and will delete all study materials.',
			confirmText: 'Delete Classroom',
			variant: 'danger',
			onConfirm: handleDeleteClassroom,
		});
	};

	const handleApprove = async studentId => {
		setApprovingId(studentId);
		try {
			await approveClassroomStudent(id, studentId);
			// Move from pending to students in local state
			setClassroom(prev => {
				const student = prev.pendingStudents.find(s => s._id === studentId);
				return {
					...prev,
					pendingStudents: prev.pendingStudents.filter(s => s._id !== studentId),
					students: student ? [...prev.students, student] : prev.students,
				};
			});
			addToast('Student approved!', 'success');
		} catch (error) {
			addToast(error.message || 'Failed to approve student', 'error');
		} finally {
			setApprovingId(null);
		}
	};

	const handleReject = async studentId => {
		setRejectingId(studentId);
		try {
			await rejectClassroomStudent(id, studentId);
			// Remove from pending
			setClassroom(prev => ({
				...prev,
				pendingStudents: prev.pendingStudents.filter(s => s._id !== studentId),
			}));
			addToast('Request rejected', 'success');
		} catch (error) {
			addToast(error.message || 'Failed to reject student', 'error');
		} finally {
			setRejectingId(null);
		}
	};

	const requestRejectStudent = studentId => {
		setConfirmState({
			isOpen: true,
			title: 'Reject Request',
			message: 'Are you sure you want to reject this student\'s request to join?',
			confirmText: 'Reject',
			variant: 'danger',
			onConfirm: () => handleReject(studentId),
		});
	};

	const formatBytes = (bytes, decimals = 2) => {
		if (!+bytes) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!classroom) return null;

	const pendingCount = classroom.pendingStudents?.length || 0;

	return (
		<div className="mx-auto max-w-5xl p-6">
			{/* Header */}
			<div className="mb-8">
				<button
					onClick={() => navigate('/teacher/classrooms')}
					className="mb-4 flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
				>
					<ArrowLeft className="mr-1 h-4 w-4" />
					Back to Classrooms
				</button>
				<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
					<div className="flex items-start gap-4">
						<div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
							<BookOpen className="h-7 w-7" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
								{classroom.name}
							</h1>
							{classroom.description && (
								<p className="mt-1 text-gray-500 dark:text-gray-400">
									{classroom.description}
								</p>
							)}
						</div>
					</div>
					<button
						onClick={requestDeleteClassroom}
						disabled={deletingClassroom}
						className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
					>
						{deletingClassroom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
						Delete Classroom
					</button>
				</div>
			</div>

			{/* Share / Invite Section */}
			<div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
				<div className="mb-4 flex items-center gap-2">
					<Share2 className="h-5 w-5 text-primary" />
					<h2 className="text-lg font-bold text-gray-900 dark:text-white">Invite Students</h2>
				</div>
				<p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
					Share the join code or invite link with your students. They'll need to request access and you can approve them below.
				</p>
				<div className="grid gap-3 sm:grid-cols-2">
					{/* Join Code */}
					<div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-gray-500 dark:text-gray-400">Join Code</p>
							<p className="font-mono text-xl font-bold tracking-widest text-gray-900 dark:text-white truncate">
								{classroom.joinCode}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={requestResetJoinCode}
								disabled={resettingCode}
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								title="Regenerate code"
							>
								<RefreshCw className={`h-4 w-4 ${resettingCode ? 'animate-spin' : ''}`} />
							</button>
							<button
								onClick={handleCopyCode}
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								title="Copy code"
							>
								{copiedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
							</button>
						</div>
					</div>

					{/* Invite Link */}
					<div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
						<div className="min-w-0 flex-1">
							<p className="text-xs font-medium text-gray-500 dark:text-gray-400">Invite Link</p>
							<p className="truncate text-sm font-medium text-primary">
								{inviteLink}
							</p>
						</div>
						<button
							onClick={handleCopyLink}
							className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							title="Copy link"
						>
							{copiedLink ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
						</button>
					</div>
				</div>
			</div>

			<div className="grid gap-8 lg:grid-cols-3">
				{/* Materials Section */}
				<div className="lg:col-span-2">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-xl font-bold text-gray-900 dark:text-white">Study Materials</h2>
						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileSelect}
							className="hidden"
						/>
						<button
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading}
							className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
						>
							{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
							Upload File
						</button>
					</div>

					{classroom.materials?.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-700 dark:bg-gray-800/50">
							<FileText className="h-8 w-8 text-gray-400" />
							<p className="mt-2 text-gray-500 dark:text-gray-400">No materials uploaded yet</p>
							<p className="text-sm text-gray-400">Click "Upload File" to share study materials with your students.</p>
						</div>
					) : (
						<div className="space-y-3">
							{classroom.materials.map(mat => (
								<div
									key={mat._id}
									className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/80"
								>
									<div className="flex items-center gap-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
											{getFileIcon(mat.originalName)}
										</div>
										<div className="min-w-0">
											<h4 className="truncate font-semibold text-gray-900 dark:text-white" title={mat.title || mat.originalName}>{mat.title || mat.originalName}</h4>
											<div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
												<span>{formatBytes(mat.size)}</span>
												<span>•</span>
												<span>{new Date(mat.uploadedAt).toLocaleDateString()}</span>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<a
											href={mat.fileUrl}
											target="_blank"
											rel="noopener noreferrer"
											download
											className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
											title="Download"
										>
											<Download className="h-4 w-4" />
										</a>
										<button
											onClick={() => requestDeleteMaterial(mat._id)}
											disabled={deletingId === mat._id}
											className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
											title="Delete"
										>
											{deletingId === mat._id ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Trash2 className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Right Sidebar */}
				<div className="space-y-6">
					{/* Pending Requests */}
					{pendingCount > 0 && (
						<div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10">
							<div className="mb-4 flex items-center gap-2">
								<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
								<h3 className="text-lg font-bold text-amber-900 dark:text-amber-300">
									Pending Requests
								</h3>
								<span className="ml-auto rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-500/30 dark:text-amber-300">
									{pendingCount}
								</span>
							</div>
							<ul className="space-y-3">
								{classroom.pendingStudents.map(student => (
									<li
										key={student._id}
										className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-gray-900"
									>
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
											{student.fullname?.charAt(0).toUpperCase() || '?'}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-gray-900 dark:text-white">
												{student.fullname}
											</p>
											<p className="truncate text-xs text-gray-500 dark:text-gray-400">
												{student.email}
											</p>
										</div>
										<div className="flex items-center gap-1.5">
											<button
												onClick={() => handleApprove(student._id)}
												disabled={approvingId === student._id}
												className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30"
												title="Approve"
											>
												{approvingId === student._id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<UserCheck className="h-4 w-4" />
												)}
											</button>
											<button
												onClick={() => requestRejectStudent(student._id)}
												disabled={rejectingId === student._id}
												className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30"
												title="Reject"
											>
												{rejectingId === student._id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<UserX className="h-4 w-4" />
												)}
											</button>
										</div>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Enrolled Students */}
					<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
						<div className="mb-4 flex items-center gap-2">
							<Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
							<h3 className="text-lg font-bold text-gray-900 dark:text-white">Students</h3>
							<span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
								{classroom.students?.length || 0}
							</span>
						</div>

						{classroom.students?.length === 0 ? (
							<p className="text-sm text-gray-500 dark:text-gray-400">
								No students have been approved yet. Share the invite link to get started!
							</p>
						) : (
							<ul className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
								{classroom.students.map(student => (
									<li
										key={student._id}
										className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
									>
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
											{student.fullname?.charAt(0).toUpperCase() || '?'}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-gray-900 dark:text-white">
												{student.fullname}
											</p>
											<p className="truncate text-xs text-gray-500 dark:text-gray-400">
												{student.email}
											</p>
										</div>
									</li>
								))}
							</ul>
						)}
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
