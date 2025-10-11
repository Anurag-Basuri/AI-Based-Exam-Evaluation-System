import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import {
	safeApiCall,
	updateStudentProfile,
	changeStudentPassword,
	getStudentProfile,
} from '../../services/studentServices.js';

const Message = ({ type = 'info', text, onClose }) => {
	if (!text) return null;
	const palette = {
		info: { bg: 'var(--bg-secondary)', bd: 'var(--border)', fg: 'var(--text)' },
		success: {
			bg: 'color-mix(in srgb, #10b981 12%, var(--surface))',
			bd: 'color-mix(in srgb, #10b981 40%, var(--border))',
			fg: 'var(--text)',
		},
		error: {
			bg: 'color-mix(in srgb, #ef4444 12%, var(--surface))',
			bd: 'color-mix(in srgb, #ef4444 40%, var(--border))',
			fg: 'var(--text)',
		},
	};
	const s = palette[type] || palette.info;

	return (
		<div
			role={type === 'error' ? 'alert' : 'status'}
			aria-live="polite"
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 12,
				padding: '12px 14px',
				borderRadius: 12,
				background: s.bg,
				border: `1px solid ${s.bd}`,
				color: s.fg,
				fontSize: 14,
				marginBottom: 16,
			}}
		>
			<span style={{ lineHeight: 1.4 }}>{text}</span>
			{onClose && (
				<button
					type="button"
					onClick={onClose}
					aria-label="Dismiss"
					style={{
						background: 'transparent',
						border: `1px solid var(--border)`,
						color: 'var(--text)',
						borderRadius: 8,
						padding: '2px 8px',
						fontWeight: 700,
						cursor: 'pointer',
					}}
				>
					×
				</button>
			)}
		</div>
	);
};

const Field = ({ label, required, children }) => (
	<label style={{ display: 'grid', gap: 6 }}>
		<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
			{label} {required ? <span style={{ color: '#ef4444' }}>*</span> : null}
		</span>
		{children}
	</label>
);

const Input = props => (
	<input
		{...props}
		style={{
			padding: '10px 12px',
			borderRadius: 10,
			border: '1px solid var(--border)',
			background: 'var(--surface)',
			color: 'var(--text)',
			fontSize: 14,
			outline: 'none',
		}}
	/>
);

const Select = props => (
	<select
		{...props}
		style={{
			padding: '10px 12px',
			borderRadius: 10,
			border: '1px solid var(--border)',
			background: 'var(--surface)',
			color: 'var(--text)',
			fontSize: 14,
			outline: 'none',
		}}
	/>
);

const Card = ({ title, children, onSubmit, submitText, submitting }) => (
	<form
		onSubmit={onSubmit}
		style={{
			background: 'var(--surface)',
			border: '1px solid var(--border)',
			borderRadius: 14,
			padding: 18,
			display: 'grid',
			gap: 14,
		}}
	>
		<h2
			style={{
				margin: 0,
				fontSize: 18,
				fontWeight: 800,
				color: 'var(--text)',
				borderBottom: '1px solid var(--border)',
				paddingBottom: 10,
			}}
		>
			{title}
		</h2>
		{children}
		<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
			<button
				type="submit"
				disabled={submitting}
				style={{
					padding: '10px 14px',
					borderRadius: 10,
					border: '1px solid var(--border)',
					background: 'var(--bg)',
					color: 'var(--text)',
					fontWeight: 800,
					cursor: submitting ? 'not-allowed' : 'pointer',
					opacity: submitting ? 0.7 : 1,
					minWidth: 120,
				}}
			>
				{submitting ? 'Please wait…' : submitText}
			</button>
		</div>
	</form>
);

const validateEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
const normalizePhone = v =>
	String(v || '')
		.replace(/[^\d+]/g, '')
		.slice(0, 20);

const StudentSettings = () => {
	const { user, setUser, logout } = useAuth();
	const navigate = useNavigate();
	// Keep address as a simple string (your storage format)
	const [profile, setProfile] = useState({
		username: '',
		fullname: '',
		email: '',
		phonenumber: '',
		gender: '',
		address: '',
	});

	const initialProfileRef = useRef(profile);
	const [pwd, setPwd] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const [savingProfile, setSavingProfile] = useState(false);
	const [savingPwd, setSavingPwd] = useState(false);
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [loggingOut, setLoggingOut] = useState(false);
	const [msg, setMsg] = useState({ type: 'info', text: '' });

	// Load full profile (token may be minimal)
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoadingProfile(true);
				const server = await safeApiCall(getStudentProfile);
				if (!mounted) return;
				const merged = {
					username: server?.username ?? user?.username ?? '',
					fullname: server?.fullname ?? user?.fullname ?? '',
					email: server?.email ?? user?.email ?? '',
					phonenumber: server?.phonenumber ?? user?.phonenumber ?? '',
					gender: server?.gender ?? user?.gender ?? '',
					address: server?.address ?? user?.address ?? '',
				};
				setProfile(merged);
				initialProfileRef.current = merged;
				if (setUser) setUser(prev => ({ ...(prev || {}), ...merged }));
			} catch {
				// Fall back to token user if available
				const fallback = {
					username: user?.username ?? '',
					fullname: user?.fullname ?? '',
					email: user?.email ?? '',
					phonenumber: user?.phonenumber ?? '',
					gender: user?.gender ?? '',
					address: user?.address ?? '',
				};
				setProfile(fallback);
				initialProfileRef.current = fallback;
				setMsg({
					type: 'info',
					text: 'Using cached account info. Live profile unavailable.',
				});
			} finally {
				if (mounted) setLoadingProfile(false);
			}
		})();
		return () => {
			mounted = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const show = useCallback((text, type = 'info') => setMsg({ text, type }), []);

	const isDirty =
		JSON.stringify(profile) !== JSON.stringify(initialProfileRef.current) && !loadingProfile;

	const onSaveProfile = async e => {
		e.preventDefault();
		if (!validateEmail(profile.email)) {
			show('Please enter a valid email address.', 'error');
			return;
		}

		setSavingProfile(true);
		setMsg({ text: '', type: 'info' });

		try {
			const body = {
				username: String(profile.username || '').trim(),
				fullname: String(profile.fullname || '').trim(),
				email: String(profile.email || '').trim(),
				phonenumber: normalizePhone(profile.phonenumber),
				gender: String(profile.gender || '').trim(),
				address: String(profile.address || '').trim(), // address is a string in your model
			};

			const saved = await safeApiCall(updateStudentProfile, body);

			// Sync UI state and auth context
			const merged = { ...(saved || body) };
			setProfile(merged);
			initialProfileRef.current = merged;
			if (setUser) setUser(prev => ({ ...(prev || {}), ...merged }));

			show('Profile updated successfully.', 'success');
		} catch (err) {
			show(err?.message || 'Failed to update profile', 'error');
		} finally {
			setSavingProfile(false);
		}
	};

	const onChangePassword = async e => {
		e.preventDefault();
		setSavingPwd(true);
		setMsg({ text: '', type: 'info' });

		try {
			const currentPassword = String(pwd.currentPassword || '');
			const newPassword = String(pwd.newPassword || '');
			const confirmPassword = String(pwd.confirmPassword || '');

			if (!newPassword) throw new Error('New password is required');
			if (newPassword.length < 6)
				throw new Error('New password must be at least 6 characters');
			if (newPassword !== confirmPassword)
				throw new Error('New password and confirmation do not match');

			await safeApiCall(changeStudentPassword, { currentPassword, newPassword });

			setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
			show('Password changed successfully.', 'success');
		} catch (err) {
			show(err?.message || 'Failed to change password', 'error');
		} finally {
			setSavingPwd(false);
		}
	};

	const onLogout = async () => {
		if (loggingOut) return;
		setLoggingOut(true);
		try {
			await logout?.(); // unified logout clears tokens, state, and navigates
		} finally {
			setLoggingOut(false);
		}
	};

	return (
		<div style={{ maxWidth: 860, display: 'grid', gap: 16 }}>
			{/* Heading */}
			<div
				style={{
					background: 'var(--surface)',
					border: '1px solid var(--border)',
					borderRadius: 14,
					padding: 18,
				}}
			>
				<h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
					Account Settings
				</h1>
				<p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
					Update your profile and change your password.
					{loadingProfile ? ' Loading profile…' : ''}
				</p>
			</div>

			<Message
				type={msg.type}
				text={msg.text}
				onClose={() => setMsg({ text: '', type: 'info' })}
			/>

			{/* Profile */}
			<Card
				title="Profile"
				submitText={savingProfile || loadingProfile ? 'Saving…' : 'Save Profile'}
				submitting={savingProfile || loadingProfile || !isDirty}
				onSubmit={onSaveProfile}
			>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
						gap: 12,
						opacity: loadingProfile ? 0.6 : 1,
						pointerEvents: loadingProfile ? 'none' : 'auto',
					}}
				>
					<Field label="Username" required>
						<Input
							name="username"
							value={profile.username}
							onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
							autoComplete="username"
							required
						/>
					</Field>

					<Field label="Full name" required>
						<Input
							name="fullname"
							value={profile.fullname}
							onChange={e => setProfile(p => ({ ...p, fullname: e.target.value }))}
							autoComplete="name"
							required
						/>
					</Field>

					<Field label="Email" required>
						<Input
							type="email"
							name="email"
							value={profile.email}
							onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
							autoComplete="email"
							required
						/>
					</Field>

					<Field label="Phone">
						<Input
							type="tel"
							name="phonenumber"
							value={profile.phonenumber}
							onChange={e => setProfile(p => ({ ...p, phonenumber: e.target.value }))}
							autoComplete="tel"
						/>
					</Field>

					<Field label="Gender">
						<Select
							name="gender"
							value={profile.gender}
							onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
						>
							<option value="">Select…</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
							<option value="other">Other</option>
							<option value="prefer_not_to_say">Prefer not to say</option>
						</Select>
					</Field>

					<Field label="Address">
						<Input
							name="address"
							value={profile.address}
							onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
							autoComplete="street-address"
						/>
					</Field>
				</div>
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
					<button
						type="button"
						onClick={() => setProfile(initialProfileRef.current)}
						disabled={!isDirty || loadingProfile || savingProfile}
						title="Reset changes"
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text-muted)',
							fontWeight: 700,
							cursor: !isDirty ? 'not-allowed' : 'pointer',
							opacity: !isDirty ? 0.6 : 1,
						}}
					>
						Reset
					</button>
					<button
						type="submit"
						disabled={savingProfile || loadingProfile || !isDirty}
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: '1px solid color-mix(in srgb, var(--text) 10%, var(--border))',
							background: 'linear-gradient(135deg, #22c55e, #16a34a)',
							color: '#fff',
							fontWeight: 800,
							minWidth: 120,
							cursor:
								savingProfile || loadingProfile || !isDirty
									? 'not-allowed'
									: 'pointer',
							opacity: savingProfile || loadingProfile || !isDirty ? 0.8 : 1,
						}}
					>
						{savingProfile ? 'Saving…' : 'Save Profile'}
					</button>
				</div>
			</Card>

			{/* Password */}
			<Card
				title="Change Password"
				submitText={savingPwd ? 'Changing…' : 'Change Password'}
				submitting={savingPwd}
				onSubmit={onChangePassword}
			>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
						gap: 12,
					}}
				>
					<Field label="Current password" required>
						<Input
							type="password"
							name="currentPassword"
							value={pwd.currentPassword}
							onChange={e => setPwd(p => ({ ...p, currentPassword: e.target.value }))}
							autoComplete="current-password"
							required
						/>
					</Field>

					<Field label="New password" required>
						<Input
							type="password"
							name="newPassword"
							value={pwd.newPassword}
							onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))}
							minLength={6}
							autoComplete="new-password"
							required
						/>
					</Field>

					<Field label="Confirm new password" required>
						<Input
							type="password"
							name="confirmPassword"
							value={pwd.confirmPassword}
							onChange={e => setPwd(p => ({ ...p, confirmPassword: e.target.value }))}
							minLength={6}
							autoComplete="new-password"
							required
						/>
					</Field>
				</div>
			</Card>

			{/* Logout */}
			<div
				className="surface-card"
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 12,
					padding: 18,
				}}
			>
				<div>
					<h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
						Logout
					</h3>
					<p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
						Sign out from your account on this device.
					</p>
				</div>
				<button
					type="button"
					onClick={onLogout}
					disabled={loggingOut}
					style={{
						padding: '10px 14px',
						borderRadius: 10,
						border: '1px solid var(--border)',
						background: 'linear-gradient(135deg, #ef4444, #dc2626)',
						color: '#fff',
						fontWeight: 900,
						cursor: 'pointer',
						opacity: loggingOut ? 0.8 : 1,
						minWidth: 130,
					}}
				>
					{loggingOut ? 'Logging out…' : 'Logout'}
				</button>
			</div>
		</div>
	);
};

export default StudentSettings;
