import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, Users, Loader2, LogIn, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import {
	getClassroomPreview,
	joinStudentClassroom,
} from '../services/studentServices';
import './Auth.css';

export default function JoinClassroom() {
	const { code } = useParams();
	const navigate = useNavigate();
	const { isAuthenticated, role, loading: authLoading } = useAuth();

	const [preview, setPreview] = useState(null);
	const [loading, setLoading] = useState(true);
	const [joining, setJoining] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (authLoading) return;

		if (!isAuthenticated) {
			setLoading(false);
			return;
		}

		fetchPreview();
	}, [code, isAuthenticated, authLoading]);

	const fetchPreview = async () => {
		try {
			const data = await getClassroomPreview(code);
			setPreview(data);

			if (data?.membershipStatus === 'enrolled') {
				setResult({
					type: 'success',
					message: 'You are already a member of this classroom!',
				});
			} else if (data?.membershipStatus === 'pending') {
				setResult({
					type: 'pending',
					message: 'Your join request is already pending. Please wait for the teacher to approve.',
				});
			}
		} catch (err) {
			setError(err?.message || 'Classroom not found. The invite link may be invalid.');
		} finally {
			setLoading(false);
		}
	};

	const handleJoin = async () => {
		setJoining(true);
		try {
			await joinStudentClassroom(code);
			setResult({
				type: 'pending',
				message: 'Join request sent! The teacher will review your request.',
			});
		} catch (err) {
			setResult({
				type: 'error',
				message: err?.message || 'Failed to send join request.',
			});
		} finally {
			setJoining(false);
		}
	};

	const redirectUrl = `/join/${code}`;
	const loginUrl = `/login?redirect=${encodeURIComponent(redirectUrl)}`;

	if (authLoading || loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
				<div className="text-center">
					<Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
					<p className="mt-4 text-gray-500 dark:text-gray-400">Loading classroom info…</p>
				</div>
			</div>
		);
	}

	return (
		<div className="auth-page" style={{ minHeight: '100vh', padding: '1rem' }}>
			{/* Background Layers */}
			<div className="auth-bg-layer" />
			<div className="auth-blob auth-blob-1" />
			<div className="auth-blob auth-blob-2" />

			<div className="relative z-10 mx-auto mt-[10vh] flex w-full max-w-md items-center justify-center">
				<div className="auth-glass-card w-full" style={{ padding: '2rem' }}>
					{/* Header */}
					<div className="mb-6 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<BookOpen className="h-8 w-8" />
						</div>
						<h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
							Join Classroom
						</h1>
						<p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
							You've been invited to join a classroom
						</p>
					</div>

					{/* Error State */}
					{error && (
						<div className="rounded-xl bg-red-50 p-4 text-center dark:bg-red-500/10">
							<XCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
							<p className="font-medium text-red-700 dark:text-red-400">{error}</p>
							<Link
								to="/"
								className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
							>
								Go to Home
							</Link>
						</div>
					)}

					{/* Not Authenticated */}
					{!isAuthenticated && !error && (
						<>
							<div className="mb-6 rounded-xl p-5" style={{ background: 'var(--bg-secondary)' }}>
								<p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
									Invite Code:{' '}
									<strong className="font-mono tracking-wider" style={{ color: 'var(--text)' }}>
										{code?.toUpperCase()}
									</strong>
								</p>
							</div>
							<p className="mb-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
								Please log in to your student account to join this classroom.
							</p>
							<Link
								to={loginUrl}
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-strong active:scale-[0.98]"
							>
								<LogIn className="h-5 w-5" />
								Log In to Join
							</Link>
						</>
					)}

					{/* Authenticated — Preview Card */}
					{isAuthenticated && preview && !error && (
						<>
							<div className="mb-6 rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
								<h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
									{preview.name}
								</h2>
								{preview.description && (
									<p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
										{preview.description}
									</p>
								)}
								<div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
									<span className="flex items-center gap-1.5 rounded-md px-2.5 py-1" style={{ background: 'var(--bg-secondary)' }}>
										Teacher: <strong style={{ color: 'var(--text)' }}>{preview.teacherName}</strong>
									</span>
									<span className="flex items-center gap-1.5 rounded-md px-2.5 py-1" style={{ background: 'var(--bg-secondary)' }}>
										<Users className="h-3.5 w-3.5" />
										{preview.studentCount} student{preview.studentCount !== 1 ? 's' : ''}
									</span>
								</div>
							</div>

							{/* Result Messages */}
							{result?.type === 'success' && (
								<div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center dark:border-green-900/50 dark:bg-green-500/10">
									<CheckCircle className="mx-auto mb-3 h-8 w-8 text-green-500" />
									<p className="font-semibold text-green-800 dark:text-green-400">{result.message}</p>
									<button
										onClick={() => navigate(`/student/classrooms/${preview._id}`)}
										className="mt-4 flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
									>
										Go to Classroom
									</button>
								</div>
							)}

							{result?.type === 'pending' && (
								<div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-900/50 dark:bg-amber-500/10">
									<Clock className="mx-auto mb-3 h-8 w-8 text-amber-500" />
									<p className="font-semibold text-amber-800 dark:text-amber-400">{result.message}</p>
									<button
										onClick={() => navigate('/student/classrooms')}
										className="mt-4 flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
									>
										View My Classrooms
									</button>
								</div>
							)}

							{result?.type === 'error' && (
								<div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-900/50 dark:bg-red-500/10">
									<XCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
									<p className="font-medium text-red-700 dark:text-red-400">{result.message}</p>
									<button
										onClick={() => navigate('/student')}
										className="mt-4 flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
									>
										Go to Dashboard
									</button>
								</div>
							)}

							{/* Join Button */}
							{!result && role === 'student' && (
								<button
									onClick={handleJoin}
									disabled={joining}
									className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-strong hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
								>
									{joining ? (
										<Loader2 className="h-5 w-5 animate-spin" />
									) : (
										<LogIn className="h-5 w-5" />
									)}
									Request to Join Classroom
								</button>
							)}

							{/* Teacher trying to join */}
							{!result && role === 'teacher' && (
								<div className="rounded-xl p-5 text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
									<p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
										Teachers cannot join classrooms as students.
									</p>
									<button
										onClick={() => navigate('/teacher/classrooms')}
										className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
										style={{ background: 'var(--border)', color: 'var(--text)' }}
									>
										Go to My Classrooms
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
