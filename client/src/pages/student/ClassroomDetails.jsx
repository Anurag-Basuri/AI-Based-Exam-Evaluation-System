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
} from 'lucide-react';
import { getStudentClassroomById } from '../../services/studentServices';
import { useToast } from '../../components/ui/Toaster';

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

	useEffect(() => {
		fetchClassroom();
	}, [id]);

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
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!classroom) return null;

	const materialCount = classroom.materials?.length || 0;

	return (
		<div className="mx-auto max-w-5xl p-6">
			{/* Header */}
			<div className="mb-8">
				<button
					onClick={() => navigate('/student/classrooms')}
					className="mb-4 flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
				>
					<ArrowLeft className="mr-1.5 h-4 w-4" />
					Back to Classrooms
				</button>

				<div className="flex items-start gap-4">
					<div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary sm:flex">
						<BookOpen className="h-8 w-8" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
							{classroom.name}
						</h1>
						{classroom.teacher && (
							<p className="mt-1 text-sm font-medium text-primary">
								Teacher: {classroom.teacher.fullname}
							</p>
						)}
						{classroom.description && (
							<p className="mt-2 max-w-lg text-gray-500 dark:text-gray-400">
								{classroom.description}
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="grid gap-8 lg:grid-cols-3">
				{/* Materials Section */}
				<div className="lg:col-span-2">
					<div className="mb-4 flex items-center gap-3">
						<h2 className="text-xl font-bold text-gray-900 dark:text-white">
							Study Materials
						</h2>
						{materialCount > 0 && (
							<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
								{materialCount}
							</span>
						)}
					</div>

					{materialCount === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-700 dark:bg-gray-800/50">
							<div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
								<FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
							</div>
							<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
								No materials available yet
							</p>
							<p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
								Check back later when your teacher uploads files.
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{classroom.materials.map(mat => (
								<div
									key={mat._id}
									className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-gray-600"
								>
									<div className="flex items-center gap-4 min-w-0">
										<div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
											{getFileIcon(mat.originalName)}
											<span className="absolute -bottom-1 -right-1 rounded bg-gray-800 px-1 py-px text-[9px] font-bold uppercase leading-none text-white dark:bg-gray-600">
												{getFileExtBadge(mat.originalName)}
											</span>
										</div>
										<div className="min-w-0">
											<h4 className="truncate text-sm font-semibold text-gray-900 dark:text-white" title={mat.title || mat.originalName}>
												{mat.title || mat.originalName}
											</h4>
											<div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
												<span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium dark:bg-gray-700">{formatBytes(mat.size)}</span>
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
										className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 opacity-70 transition-all hover:bg-primary hover:text-white group-hover:opacity-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-primary dark:hover:text-white"
										title="Download Material"
									>
										<Download className="h-4 w-4" />
									</a>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Sidebar (Students list) */}
				<div>
					<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
						<div className="mb-4 flex items-center gap-2">
							<Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
							<h3 className="text-base font-bold text-gray-900 dark:text-white">
								Classmates
							</h3>
							<span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
								{classroom.students?.length || 0}
							</span>
						</div>

						{classroom.students?.length === 0 ? (
							<p className="text-sm text-gray-500 dark:text-gray-400">
								You are the first student in this classroom!
							</p>
						) : (
							<ul className="max-h-[400px] space-y-1 overflow-y-auto pr-1">
								{classroom.students.map(student => (
									<li
										key={student._id}
										className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
									>
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
											{student.fullname?.charAt(0).toUpperCase() || '?'}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium text-gray-900 dark:text-white">
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
	);
}
