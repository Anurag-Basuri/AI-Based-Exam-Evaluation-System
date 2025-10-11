import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import {
	safeApiCall,
	updateStudentProfile,
	changeStudentPassword,
	logoutStudentApi,
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

const Input = ({ style, ...props }) => (
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
			transition: 'border-color .15s ease, box-shadow .15s ease',
			boxShadow: 'none',
			...style,
		}}
		onFocus={e => {
			e.currentTarget.style.borderColor = 'var(--text-muted)';
			e.currentTarget.style.boxShadow =
				'0 0 0 3px color-mix(in srgb, var(--text-muted) 20%, transparent)';
		}}
		onBlur={e => {
			e.currentTarget.style.borderColor = 'var(--border)';
			e.currentTarget.style.boxShadow = 'none';
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
				}}
			>
				{submitting ? 'Please wait…' : submitText}
			</button>
		</div>
	</form>
);

const StudentSettings = () => {
	const auth = useAuth();
	const user = auth?.user;
	const logout = auth?.logout;

	// Profile state: only fields supported by controller (username, fullname, email, phonenumber, gender, address)
	const [profile, setProfile] = React.useState({
		username: user?.username || '',
		fullname: user?.fullname || '',
		email: user?.email || '',
		phonenumber: user?.phonenumber || '',
		gender: user?.gender || '',
		address: user?.address || '',
	});

	const [pwd, setPwd] = React.useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const [savingProfile, setSavingProfile] = React.useState(false);
	const [savingPwd, setSavingPwd] = React.useState(false);
	const [msg, setMsg] = React.useState({ type: 'info', text: '' });

	React.useEffect(() => {
		if (!user) return;
		setProfile({
			username: user.username || '',
			fullname: user.fullname || '',
			email: user.email || '',
			phonenumber: user.phonenumber || '',
			gender: user.gender || '',
			address: user.address || '',
		});
	}, [user]);

	const show = (text, type = 'info') => setMsg({ text, type });

	const onSaveProfile = async e => {
		e.preventDefault();
		setSavingProfile(true);
		setMsg({ text: '', type: 'info' });

		try {
			const body = {
				username: String(profile.username || '').trim(),
				fullname: String(profile.fullname || '').trim(),
				email: String(profile.email || '').trim(),
				phonenumber: String(profile.phonenumber || '').trim(),
				gender: String(profile.gender || '').trim(),
				address: String(profile.address || '').trim(),
			};

			const payload = await safeApiCall(updateStudentProfile, body);

			// Update auth context if setter exists
			if (auth?.setUser) {
				auth.setUser(prev => ({ ...(prev || {}), ...(payload || body) }));
			}

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
		try {
			await safeApiCall(logoutStudentApi).catch(() => {});
		} finally {
			logout?.();
		}
	};

	return (
		<div style={{ maxWidth: 860, display: 'grid', gap: 16 }}>
			{/* Page heading */}
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
				submitText="Save Profile"
				submitting={savingProfile}
				onSubmit={onSaveProfile}
			>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
						gap: 12,
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
			</Card>

			{/* Password */}
			<Card
				title="Change Password"
				submitText="Change Password"
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
					style={{
						padding: '10px 14px',
						borderRadius: 10,
						border: '1px solid var(--border)',
						background: 'linear-gradient(135deg, #ef4444, #dc2626)',
						color: '#fff',
						fontWeight: 900,
						cursor: 'pointer',
					}}
				>
					Logout
				</button>
			</div>
		</div>
	);
};

export default StudentSettings;
