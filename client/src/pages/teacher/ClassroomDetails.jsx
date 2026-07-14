import React, { useState, useEffect, useRef, useCallback } from 'react';
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
	RefreshCw,
	CloudUpload,
	X,
	Layout,
} from 'lucide-react';
import {
	getTeacherClassroomById,
	uploadClassroomMaterial,
	deleteClassroomMaterial,
	approveClassroomStudent,
	rejectClassroomStudent,
	deleteTeacherClassroom,
	resetClassroomJoinCode,
	getMaterialDownloadUrl,
} from '../../services/teacherServices';
import { useToast } from '../../components/ui/Toaster';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useSocket } from '../../hooks/useSocket.js';

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

export default function TeacherClassroomDetails() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { addToast } = useToast();
	const fileInputRef = useRef(null);
	const dropZoneRef = useRef(null);

	const [classroom, setClassroom] = useState(null);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [deletingId, setDeletingId] = useState(null);
	const [downloadingId, setDownloadingId] = useState(null);
	const [deletingClassroom, setDeletingClassroom] = useState(false);
	const [copiedCode, setCopiedCode] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);
	const [approvingId, setApprovingId] = useState(null);
	const [rejectingId, setRejectingId] = useState(null);
	const [resettingCode, setResettingCode] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

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

		const handleJoinRequest = (data) => {
			if (data.classroomId === id) {
				addToast('New join request received', 'info');
				fetchClassroom();
			}
		};

		const handleMaterialsUpdated = (data) => {
			if (data.classroomId === id) {
				fetchClassroom();
			}
		};

		socket.on('classroom-join-request', handleJoinRequest);
		socket.on('classroom-materials-updated', handleMaterialsUpdated);

		return () => {
			socket.off('classroom-join-request', handleJoinRequest);
			socket.off('classroom-materials-updated', handleMaterialsUpdated);
		};
	}, [socket, id]);

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

	const uploadFile = useCallback(async file => {
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
	}, [id, addToast]);

	const handleFileSelect = e => {
		uploadFile(e.target.files?.[0]);
	};

	// Drag and drop handlers
	const handleDragEnter = useCallback(e => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback(e => {
		e.preventDefault();
		e.stopPropagation();
		if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
			setIsDragging(false);
		}
	}, []);

	const handleDragOver = useCallback(e => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(e => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const file = e.dataTransfer?.files?.[0];
		if (file) uploadFile(file);
	}, [uploadFile]);

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

	const handleDownloadMaterial = async (e, materialId) => {
		e.preventDefault();
		setDownloadingId(materialId);
		try {
			const downloadUrl = await getMaterialDownloadUrl(id, materialId);
			if (downloadUrl) {
				window.location.href = downloadUrl;
			}
		} catch (error) {
			addToast(error.message || 'Failed to get download link', 'error');
		} finally {
			setDownloadingId(null);
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
			<div className="flex h-[calc(100vh-100px)] items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
						<Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
					</div>
					<p className="font-bold text-gray-500 dark:text-gray-400 animate-pulse">Loading classroom details...</p>
				</div>
			</div>
		);
	}

	if (!classroom) return null;

	const pendingCount = classroom.pendingStudents?.length || 0;
	const materialCount = classroom.materials?.length || 0;

	return (
		<div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 dash-enter">
			{/* Header */}
			<div className="mb-8">
				<button
					onClick={() => navigate('/teacher/classrooms')}
					className="mb-6 flex w-fit items-center text-sm font-bold text-gray-500 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Classrooms
				</button>
				<div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
					<div className="flex items-center gap-5">
						<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
							<BookOpen className="h-8 w-8" />
						</div>
						<div>
							<h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
								{classroom.name}
							</h1>
							{classroom.description && (
								<p className="mt-1.5 max-w-xl text-sm font-medium text-gray-500 dark:text-gray-400">
									{classroom.description}
								</p>
							)}
						</div>
					</div>
					<button
						onClick={requestDeleteClassroom}
						disabled={deletingClassroom}
						className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 shadow-sm"
					>
						{deletingClassroom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
						Delete Classroom
					</button>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Column */}
				<div className="lg:col-span-2 space-y-6">
					
					{/* Materials Section */}
					<div className="glass-card p-6 md:p-8">
						<div className="mb-6 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
									<div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
									Study Materials
								</h2>
								{materialCount > 0 && (
									<span className="rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
										{materialCount} files
									</span>
								)}
							</div>
						</div>

						{/* Upload Drop Zone */}
						<div
							ref={dropZoneRef}
							onDragEnter={handleDragEnter}
							onDragLeave={handleDragLeave}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							onClick={() => !uploading && fileInputRef.current?.click()}
							className={`group mb-8 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 transition-all duration-300 relative overflow-hidden ${
								isDragging
									? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.02]'
									: uploading
										? 'cursor-wait border-gray-300 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30 opacity-70'
										: 'border-gray-300 bg-gray-50/50 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-gray-700 dark:bg-gray-800/20 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5 hover:shadow-lg'
							}`}
						>
							<input
								type="file"
								ref={fileInputRef}
								onChange={handleFileSelect}
								className="hidden"
							/>
							
							{isDragging && <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 pointer-events-none"></div>}

							{uploading ? (
								<div className="flex flex-col items-center relative z-10">
									<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 shadow-inner">
										<Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
									</div>
									<p className="text-sm font-bold text-gray-700 dark:text-gray-200">Uploading your file...</p>
									<div className="mt-4 h-2 w-56 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700/50">
										<div className="h-full animate-pulse rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: '70%' }} />
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center relative z-10 text-center">
									<div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-3xl transition-all duration-300 ${
										isDragging 
											? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 scale-110 shadow-lg' 
											: 'bg-white text-gray-400 shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-110 dark:bg-gray-800 dark:text-gray-500 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400'
									}`}>
										<CloudUpload className="h-8 w-8" />
									</div>
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
										{isDragging ? 'Drop it like it\'s hot' : 'Upload Study Material'}
									</h3>
									<p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 max-w-sm">
										Drag & drop your files here, or <span className="text-indigo-600 dark:text-indigo-400 hover:underline">browse</span>
									</p>
									<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg">
										<span>10MB MAX</span>
										<span>•</span>
										<span>PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, Images, ZIP</span>
									</div>
								</div>
							)}
						</div>

						{/* Materials List */}
						{materialCount === 0 ? (
							<div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center dark:border-gray-700/50 dark:bg-gray-800/20">
								<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
									<FileText className="h-8 w-8" />
								</div>
								<h4 className="text-base font-bold text-gray-900 dark:text-white">No materials yet</h4>
								<p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs">Upload files above to share resources with your students.</p>
							</div>
						) : (
							<div className="space-y-3">
								{classroom.materials.map(mat => (
									<div
										key={mat._id}
										className="group/item flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4 transition-all hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-500/30"
									>
										<div className="flex items-center gap-4 min-w-0 flex-1">
											<div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover/item:scale-105 transition-transform">
												{getFileIcon(mat.originalName)}
												<span className="absolute -bottom-2 -right-2 rounded-lg bg-gray-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white dark:bg-gray-700 shadow-sm border border-gray-800 dark:border-gray-600">
													{getFileExtBadge(mat.originalName)}
												</span>
											</div>
											<div className="min-w-0 pr-4">
												<h4 className="truncate text-sm font-bold text-gray-900 dark:text-white group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors" title={mat.title || mat.originalName}>
													{mat.title || mat.originalName}
												</h4>
												<div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">
													<span className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1">{formatBytes(mat.size)}</span>
													<span className="opacity-50">•</span>
													<span>{new Date(mat.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
											<button
												onClick={(e) => handleDownloadMaterial(e, mat._id)}
												disabled={downloadingId === mat._id}
												className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400"
												title="Download"
											>
												{downloadingId === mat._id ? (
													<Loader2 className="h-5 w-5 animate-spin" />
												) : (
													<Download className="h-5 w-5" />
												)}
											</button>
											<button
												onClick={() => requestDeleteMaterial(mat._id)}
												disabled={deletingId === mat._id}
												className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:bg-gray-800 dark:text-rose-400 dark:hover:bg-rose-500/20 dark:hover:text-rose-300"
												title="Delete"
											>
												{deletingId === mat._id ? (
													<Loader2 className="h-5 w-5 animate-spin" />
												) : (
													<Trash2 className="h-5 w-5" />
												)}
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Right Sidebar */}
				<div className="space-y-6">
					
					{/* Share / Invite Section */}
					<div className="glass-card p-6 relative overflow-hidden">
						<div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
						<div className="mb-5 flex items-center gap-3 relative z-10">
							<div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
								<Share2 className="h-5 w-5" />
							</div>
							<h2 className="text-lg font-black text-gray-900 dark:text-white">Invite Students</h2>
						</div>
						
						<div className="space-y-4 relative z-10">
							{/* Join Code */}
							<div className="flex flex-col gap-2">
								<label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Join Code</label>
								<div className="flex items-center gap-2">
									<div className="flex-1 flex items-center px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
										<span className="font-mono text-lg font-black tracking-widest text-gray-900 dark:text-white">
											{classroom.joinCode}
										</span>
									</div>
									<button
										onClick={requestResetJoinCode}
										disabled={resettingCode}
										className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
										title="Regenerate code"
									>
										<RefreshCw className={`h-5 w-5 ${resettingCode ? 'animate-spin' : ''}`} />
									</button>
									<button
										onClick={handleCopyCode}
										className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm transition-all hover:bg-indigo-100 hover:border-indigo-300 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/30"
										title="Copy code"
									>
										{copiedCode ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
									</button>
								</div>
							</div>

							{/* Invite Link */}
							<div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
								<label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Invite Link</label>
								<div className="flex items-center gap-2">
									<div className="flex-1 flex items-center px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 overflow-hidden">
										<span className="truncate text-sm font-bold text-gray-600 dark:text-gray-300">
											{inviteLink}
										</span>
									</div>
									<button
										onClick={handleCopyLink}
										className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
										title="Copy link"
									>
										{copiedLink ? <Check className="h-4 w-4 text-indigo-500" /> : <Link2 className="h-4 w-4" />}
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Pending Requests */}
					{pendingCount > 0 && (
						<div className="glass-card border-amber-200 dark:border-amber-500/30 overflow-hidden">
							<div className="bg-amber-50 dark:bg-amber-500/10 p-5 border-b border-amber-100 dark:border-amber-500/20">
								<div className="flex items-center gap-3">
									<div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
										<Clock className="h-5 w-5" />
									</div>
									<h3 className="text-base font-black text-amber-900 dark:text-amber-300">
										Pending Requests
									</h3>
									<span className="ml-auto rounded-full bg-amber-200 dark:bg-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 shadow-sm">
										{pendingCount}
									</span>
								</div>
							</div>
							<div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
								<ul className="space-y-1">
									{classroom.pendingStudents.map(student => (
										<li
											key={student._id}
											className="flex items-center gap-3 rounded-xl p-3 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-colors"
										>
											<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
												{student.fullname?.charAt(0).toUpperCase() || '?'}
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-bold text-gray-900 dark:text-white">
													{student.fullname}
												</p>
												<p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
													{student.email}
												</p>
											</div>
											<div className="flex items-center gap-1.5">
												<button
													onClick={() => handleApprove(student._id)}
													disabled={approvingId === student._id}
													className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-100 hover:scale-105 disabled:opacity-50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
													title="Approve"
												>
													{approvingId === student._id ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<UserCheck className="h-5 w-5" />
													)}
												</button>
												<button
													onClick={() => requestRejectStudent(student._id)}
													disabled={rejectingId === student._id}
													className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-all hover:bg-rose-100 hover:scale-105 disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
													title="Reject"
												>
													{rejectingId === student._id ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<UserX className="h-5 w-5" />
													)}
												</button>
											</div>
										</li>
									))}
								</ul>
							</div>
						</div>
					)}

					{/* Enrolled Students */}
					<div className="glass-card overflow-hidden">
						<div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/20">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
									<Users className="h-5 w-5" />
								</div>
								<h3 className="text-base font-black text-gray-900 dark:text-white">Enrolled Students</h3>
								<span className="ml-auto rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm">
									{classroom.students?.length || 0}
								</span>
							</div>
						</div>

						<div className="p-2">
							{classroom.students?.length === 0 ? (
								<div className="px-4 py-8 text-center">
									<div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 text-gray-400">
										<Users className="h-5 w-5" />
									</div>
									<p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-[200px] mx-auto">
										No students enrolled yet. Share the invite link above!
									</p>
								</div>
							) : (
								<ul className="max-h-[400px] space-y-1 overflow-y-auto custom-scrollbar pr-1">
									{classroom.students.map(student => (
										<li
											key={student._id}
											className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
										>
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-sm font-black text-indigo-600 dark:text-indigo-400">
												{student.fullname?.charAt(0).toUpperCase() || '?'}
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-bold text-gray-900 dark:text-white">
													{student.fullname}
												</p>
												<p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
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
			</div>

			<ConfirmModal
				{...confirmState}
				onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
			/>
		</div>
	);
}
