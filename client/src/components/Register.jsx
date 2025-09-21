import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const Register = ({ onRegister }) => {
	const navigate = useNavigate();
	const { registerStudent, registerTeacher, loading } = useAuth();

	const [role, setRole] = useState('student'); // "student" | "teacher"
	const [fullName, setFullName] = useState('');
	const [studentId, setStudentId] = useState('');
	const [email, setEmail] = useState('');
	const [department, setDepartment] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		try {
			const pref = localStorage.getItem('preferredRole');
			if (pref === 'student' || pref === 'teacher') setRole(pref);
		} catch {}
	}, []);

	const extractError = err =>
		err?.message ||
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		'Registration failed. Please try again.';

	const emailValid = useMemo(() => {
		if (!email) return true;
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}, [email]);

	const canSubmit = useMemo(() => {
		const passOk = password.length >= 6 && password === confirm;
		const nameOk = fullName.trim().length >= 2;
		if (role === 'student') {
			const hasIdOrEmail = !!studentId.trim() || !!email.trim();
			const idOk = studentId ? studentId.trim().length >= 3 : true;
			const emailOk = email ? emailValid : true;
			return passOk && nameOk && hasIdOrEmail && idOk && emailOk;
		}
		// teacher
		return passOk && nameOk && !!email.trim() && emailValid;
	}, [role, fullName, studentId, email, emailValid, password, confirm]);

	const handleSubmit = async e => {
		e.preventDefault();
		setError('');

		if (!canSubmit) {
			setError(
				role === 'student'
					? 'Please complete required fields (name, password, and at least one of Student ID or Email).'
					: 'Please complete required fields (name, valid email, and password).',
			);
			return;
		}

		try {
			const base = {
				fullName: fullName.trim(),
				password: password.trim(),
			};

			if (role === 'student') {
				const payload = {
					...base,
					...(studentId.trim() ? { studentId: studentId.trim() } : {}),
					...(email.trim() ? { email: email.trim() } : {}),
					...(department.trim() ? { department: department.trim() } : {}),
				};
				const res = await registerStudent(payload);
				if (typeof onRegister === 'function')
					onRegister({ role, user: res?.data?.user || null });
				localStorage.setItem('preferredRole', 'student');
			} else {
				const payload = {
					...base,
					email: email.trim(),
					...(department.trim() ? { department: department.trim() } : {}),
				};
				const res = await registerTeacher(payload);
				if (typeof onRegister === 'function')
					onRegister({ role, user: res?.data?.user || null });
				localStorage.setItem('preferredRole', 'teacher');
			}
		} catch (err) {
			setError(extractError(err));
		}
	};

	const buttonGradient =
		role === 'teacher'
			? 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
			: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)';

	return (
		<div style={styles.container}>
			<form onSubmit={handleSubmit} style={styles.form} aria-labelledby="register-title">
				<h2 id="register-title" style={styles.title}>
					Create your account
				</h2>

				{/* Role switch */}
				<div style={styles.roleSwitch} role="tablist" aria-label="Choose role">
					<button
						type="button"
						role="tab"
						aria-selected={role === 'student'}
						onClick={() => setRole('student')}
						style={{
							...styles.roleTab,
							...(role === 'student' ? styles.roleTabActive : {}),
						}}
					>
						Student
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={role === 'teacher'}
						onClick={() => setRole('teacher')}
						style={{
							...styles.roleTab,
							...(role === 'teacher' ? styles.roleTabActiveTeacher : {}),
						}}
					>
						Teacher
					</button>
				</div>

				{/* Name */}
				<div style={styles.field}>
					<label style={styles.label}>Full name</label>
					<input
						style={styles.input}
						type="text"
						placeholder="e.g. Alex Morgan"
						value={fullName}
						onChange={e => setFullName(e.target.value)}
						autoComplete="name"
						required
					/>
				</div>

				{/* Student specific: ID and/or Email */}
				{role === 'student' ? (
					<>
						<div style={styles.field}>
							<label style={styles.label}>Student ID (or Email)</label>
							<input
								style={styles.input}
								type="text"
								placeholder="e.g. S12345"
								value={studentId}
								onChange={e => setStudentId(e.target.value)}
								autoComplete="off"
							/>
						</div>
						<div style={styles.field}>
							<label style={styles.label}>Email (optional if ID provided)</label>
							<input
								style={{
									...styles.input,
									...(email && !emailValid ? styles.inputInvalid : {}),
								}}
								type="email"
								placeholder="student@school.edu"
								value={email}
								onChange={e => setEmail(e.target.value)}
								autoComplete="email"
							/>
							{email && !emailValid ? (
								<span style={styles.helperText}>Enter a valid email address.</span>
							) : null}
						</div>
						<div style={styles.field}>
							<label style={styles.label}>Department (optional)</label>
							<input
								style={styles.input}
								type="text"
								placeholder="e.g. Computer Science"
								value={department}
								onChange={e => setDepartment(e.target.value)}
								autoComplete="organization-title"
							/>
						</div>
					</>
				) : (
					// Teacher specific
					<>
						<div style={styles.field}>
							<label style={styles.label}>Email</label>
							<input
								style={{
									...styles.input,
									...(email && !emailValid ? styles.inputInvalid : {}),
								}}
								type="email"
								placeholder="teacher@school.edu"
								value={email}
								onChange={e => setEmail(e.target.value)}
								autoComplete="email"
								required
							/>
							{email && !emailValid ? (
								<span style={styles.helperText}>Enter a valid email address.</span>
							) : null}
						</div>
						<div style={styles.field}>
							<label style={styles.label}>Department (optional)</label>
							<input
								style={styles.input}
								type="text"
								placeholder="e.g. Mathematics"
								value={department}
								onChange={e => setDepartment(e.target.value)}
								autoComplete="organization-title"
							/>
						</div>
					</>
				)}

				{/* Password */}
				<div style={styles.field}>
					<label style={styles.label}>Password</label>
					<div style={styles.passwordWrap}>
						<input
							style={{ ...styles.input, paddingRight: 44 }}
							type={showPassword ? 'text' : 'password'}
							placeholder="Minimum 6 characters"
							value={password}
							onChange={e => setPassword(e.target.value)}
							autoComplete="new-password"
							required
						/>
						<button
							type="button"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							onClick={() => setShowPassword(s => !s)}
							style={styles.eyeBtn}
							title={showPassword ? 'Hide password' : 'Show password'}
						>
							{showPassword ? '🙈' : '👁️'}
						</button>
					</div>
				</div>

				{/* Confirm */}
				<div style={styles.field}>
					<label style={styles.label}>Confirm password</label>
					<div style={styles.passwordWrap}>
						<input
							style={{
								...styles.input,
								paddingRight: 44,
								...(confirm && confirm !== password ? styles.inputInvalid : {}),
							}}
							type={showConfirm ? 'text' : 'password'}
							placeholder="Re-enter your password"
							value={confirm}
							onChange={e => setConfirm(e.target.value)}
							autoComplete="new-password"
							required
						/>
						<button
							type="button"
							aria-label={showConfirm ? 'Hide password' : 'Show password'}
							onClick={() => setShowConfirm(s => !s)}
							style={styles.eyeBtn}
							title={showConfirm ? 'Hide password' : 'Show password'}
						>
							{showConfirm ? '🙈' : '👁️'}
						</button>
					</div>
					{confirm && confirm !== password ? (
						<span style={styles.helperText}>Passwords do not match.</span>
					) : null}
				</div>

				{error ? (
					<div style={styles.error} role="alert" aria-live="assertive">
						{error}
					</div>
				) : null}

				<button
					type="submit"
					style={{ ...styles.button, background: buttonGradient }}
					disabled={loading || !canSubmit}
				>
					{loading ? 'Creating account...' : `Create ${role} account`}
				</button>

				<div style={styles.bottomRow}>
					<span>Already have an account?</span>
					<button type="button" style={styles.linkBtn} onClick={() => navigate('/login')}>
						Sign in
					</button>
				</div>
			</form>
		</div>
	);
};

const styles = {
	container: {
		minHeight: '100vh',
		display: 'grid',
		placeItems: 'center',
		background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
		padding: 16,
		fontFamily: "Inter, 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif",
		color: '#0f172a',
	},
	form: {
		width: '100%',
		maxWidth: 480,
		background: '#ffffff',
		padding: 24,
		borderRadius: 16,
		boxShadow: '0 10px 30px rgba(2,6,23,0.08)',
		border: '1px solid #e2e8f0',
	},
	title: {
		margin: 0,
		marginBottom: 14,
		fontWeight: 800,
		fontSize: 22,
		letterSpacing: 0.2,
		background: 'linear-gradient(90deg, #0f172a, #334155)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
	},
	roleSwitch: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: 8,
		background: '#f1f5f9',
		borderRadius: 12,
		padding: 6,
		marginBottom: 16,
	},
	roleTab: {
		appearance: 'none',
		border: 'none',
		background: 'transparent',
		padding: '10px 12px',
		borderRadius: 10,
		cursor: 'pointer',
		fontWeight: 700,
		color: '#334155',
		transition: 'background 0.2s, color 0.2s, transform 0.1s',
	},
	roleTabActive: {
		background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
		color: '#fff',
		boxShadow: '0 6px 18px rgba(79,70,229,0.25)',
	},
	roleTabActiveTeacher: {
		background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
		color: '#fff',
		boxShadow: '0 6px 18px rgba(249,115,22,0.25)',
	},
	field: { marginBottom: 12 },
	label: { display: 'block', fontSize: 14, marginBottom: 6, color: '#334155', fontWeight: 600 },
	input: {
		width: '100%',
		padding: '10px 12px',
		borderRadius: 10,
		border: '1px solid #cbd5e1',
		outline: 'none',
		fontSize: 14,
		color: '#0f172a',
		background: '#fff',
	},
	inputInvalid: {
		borderColor: '#ef4444',
		background: '#fff7f7',
	},
	helperText: {
		display: 'block',
		marginTop: 6,
		fontSize: 12,
		color: '#ef4444',
	},
	passwordWrap: { position: 'relative', display: 'grid' },
	eyeBtn: {
		position: 'absolute',
		right: 8,
		top: '50%',
		transform: 'translateY(-50%)',
		border: 'none',
		background: 'transparent',
		cursor: 'pointer',
		fontSize: 16,
		lineHeight: 1,
	},
	button: {
		width: '100%',
		padding: '12px 14px',
		borderRadius: 10,
		border: 'none',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 800,
		letterSpacing: 0.2,
		boxShadow: '0 10px 24px rgba(79,70,229,0.25)',
		marginTop: 4,
	},
	error: {
		background: '#fdecea',
		color: '#b3261e',
		padding: '10px 12px',
		borderRadius: 10,
		marginBottom: 12,
		fontSize: 14,
		border: '1px solid #f5c2c0',
	},
	bottomRow: {
		display: 'flex',
		justifyContent: 'center',
		gap: 8,
		marginTop: 12,
		fontSize: 14,
		color: '#64748b',
	},
	linkBtn: {
		appearance: 'none',
		border: 'none',
		background: 'transparent',
		color: '#4f46e5',
		cursor: 'pointer',
		fontWeight: 700,
		padding: 0,
	},
};

export default Register;
