import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { safeApiCall } from '../../services/studentServices.js';

// Create student-specific service functions using studentServices
const updateStudentProfile = profile => {
	// This should be implemented in studentServices.js
	return fetch('/api/students/update', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(profile),
	});
};

const changeStudentPassword = payload => {
	return fetch('/api/students/change-password', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
};

const logoutStudentApi = () => {
	return fetch('/api/students/logout', { method: 'POST' });
};

const StatusMessage = ({ type = 'info', children, onClose }) => {
	const styles = {
		info: { bg: '#eff6ff', border: '#bae6fd', color: '#1e40af' },
		success: { bg: '#ecfdf5', border: '#86efac', color: '#047857' },
		error: { bg: '#fef2f2', border: '#fca5a5', color: '#b91c1c' },
		warning: { bg: '#fffbeb', border: '#fed7aa', color: '#92400e' },
	};

	const config = styles[type] || styles.info;

	return (
		<div
			role="status"
			aria-live="polite"
			style={{
				padding: '14px 18px',
				borderRadius: 12,
				border: `1px solid ${config.border}`,
				background: config.bg,
				color: config.color,
				fontWeight: 600,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 12,
				boxShadow: '0 4px 12px rgba(15,23,42,0.05)',
				marginBottom: 20,
			}}
		>
			<span>{children}</span>
			{onClose && (
				<button
					onClick={onClose}
					style={{
						border: 'none',
						background: 'transparent',
						cursor: 'pointer',
						color: 'inherit',
						fontWeight: 800,
						fontSize: '18px',
						padding: '4px',
						borderRadius: '4px',
					}}
					aria-label="Dismiss message"
				>
					×
				</button>
			)}
		</div>
	);
};

const FormCard = ({ title, children, onSubmit, loading = false }) => (
	<form
		onSubmit={onSubmit}
		style={{
			background: '#ffffff',
			borderRadius: 18,
			border: '1px solid #e2e8f0',
			padding: '28px',
			marginBottom: 24,
			boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
		}}
	>
		<h3
			style={{
				margin: '0 0 24px 0',
				fontSize: '20px',
				fontWeight: 700,
				color: '#0f172a',
				paddingBottom: '12px',
				borderBottom: '1px solid #f1f5f9',
			}}
		>
			{title}
		</h3>
		<div style={{ display: 'grid', gap: '20px' }}>{children}</div>
	</form>
);

const InputField = ({ label, type = 'text', value, onChange, required = false, ...props }) => (
	<div style={{ display: 'grid', gap: '8px' }}>
		<label
			style={{
				color: '#374151',
				fontWeight: 600,
				fontSize: '14px',
				display: 'flex',
				alignItems: 'center',
				gap: '4px',
			}}
		>
			{label}
			{required && <span style={{ color: '#ef4444' }}>*</span>}
		</label>
		<input
			type={type}
			value={value}
			onChange={onChange}
			required={required}
			style={{
				padding: '12px 16px',
				borderRadius: 12,
				border: '1px solid #d1d5db',
				outline: 'none',
				background: '#f9fafb',
				color: '#111827',
				fontSize: '14px',
				fontWeight: 500,
				transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
			}}
			onFocus={e => {
				e.target.style.borderColor = '#10b981';
				e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
				e.target.style.background = '#ffffff';
			}}
			onBlur={e => {
				e.target.style.borderColor = '#d1d5db';
				e.target.style.boxShadow = 'none';
				e.target.style.background = '#f9fafb';
			}}
			{...props}
		/>
	</div>
);

const Button = ({ children, variant = 'primary', loading = false, ...props }) => {
	const styles = {
		primary: {
			background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
			color: '#ffffff',
			border: 'none',
			boxShadow: loading ? 'none' : '0 8px 20px rgba(16,185,129,0.25)',
		},
		secondary: {
			background: loading ? '#f3f4f6' : '#ffffff',
			color: loading ? '#6b7280' : '#374151',
			border: '1px solid #d1d5db',
			boxShadow: loading ? 'none' : '0 4px 12px rgba(15,23,42,0.08)',
		},
		danger: {
			background: loading ? '#9ca3af' : 'linear-gradient(135deg, #ef4444, #dc2626)',
			color: '#ffffff',
			border: 'none',
			boxShadow: loading ? 'none' : '0 8px 20px rgba(239,68,68,0.25)',
		},
	};

	return (
		<button
			disabled={loading}
			style={{
				padding: '12px 20px',
				borderRadius: 12,
				cursor: loading ? 'not-allowed' : 'pointer',
				fontWeight: 700,
				fontSize: '14px',
				transition: 'all 0.2s ease',
				opacity: loading ? 0.7 : 1,
				...styles[variant],
			}}
			onMouseEnter={e => {
				if (!loading && variant === 'primary') {
					e.target.style.transform = 'translateY(-1px)';
					e.target.style.boxShadow = '0 12px 28px rgba(16,185,129,0.35)';
				}
			}}
			onMouseLeave={e => {
				if (!loading && variant === 'primary') {
					e.target.style.transform = 'translateY(0)';
					e.target.style.boxShadow = '0 8px 20px rgba(16,185,129,0.25)';
				}
			}}
			{...props}
		>
			{children}
		</button>
	);
};

const StudentSettings = () => {
	const { user, logout } = useAuth();
	const [saving, setSaving] = React.useState(false);
	const [message, setMessage] = React.useState('');
	const [messageType, setMessageType] = React.useState('info');

	const [profile, setProfile] = React.useState({
		username: user?.username || '',
		fullname: user?.fullname || '',
		email: user?.email || '',
		phonenumber: user?.phonenumber || '',
		department: user?.department || '',
		address: user?.address || '',
	});

	const [passwords, setPasswords] = React.useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	// Update profile state when user changes
	React.useEffect(() => {
		if (user) {
			setProfile({
				username: user.username || '',
				fullname: user.fullname || '',
				email: user.email || '',
				phonenumber: user.phonenumber || '',
				department: user.department || '',
				address: user.address || '',
			});
		}
	}, [user]);

	const showMessage = (text, type = 'info') => {
		setMessage(text);
		setMessageType(type);
	};

	const saveProfile = async e => {
		e.preventDefault();
		setSaving(true);
		setMessage('');

		try {
			// Sanitize profile data
			const sanitizedProfile = Object.fromEntries(
				Object.entries(profile).map(([key, value]) => [
					key,
					typeof value === 'string' ? value.trim() : value,
				]),
			);

			await safeApiCall(updateStudentProfile, sanitizedProfile);
			showMessage('✅ Profile updated successfully!', 'success');
		} catch (error) {
			showMessage(`❌ ${error?.message || 'Failed to update profile'}`, 'error');
		} finally {
			setSaving(false);
		}
	};

	const changePassword = async e => {
		e.preventDefault();

		// Validation
		if (!passwords.newPassword.trim()) {
			showMessage('❌ New password cannot be empty', 'error');
			return;
		}

		if (passwords.newPassword.length < 6) {
			showMessage('❌ New password must be at least 6 characters long', 'error');
			return;
		}

		if (passwords.newPassword !== passwords.confirmPassword) {
			showMessage('❌ New password and confirmation do not match', 'error');
			return;
		}

		setSaving(true);
		setMessage('');

		try {
			await safeApiCall(changeStudentPassword, {
				currentPassword: passwords.currentPassword,
				newPassword: passwords.newPassword.trim(),
			});

			setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
			showMessage('✅ Password changed successfully!', 'success');
		} catch (error) {
			showMessage(`❌ ${error?.message || 'Failed to change password'}`, 'error');
		} finally {
			setSaving(false);
		}
	};

	const handleLogout = async () => {
		if (!window.confirm('Are you sure you want to logout?')) return;

		try {
			await safeApiCall(logoutStudentApi);
			logout(); // Use the logout function from useAuth
		} catch (error) {
			showMessage(`❌ ${error?.message || 'Failed to logout'}`, 'error');
		}
	};

	return (
		<div style={{ maxWidth: '800px' }}>
			{/* Header */}
			<header
				style={{
					background:
						'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.05))',
					padding: '32px 28px',
					borderRadius: 20,
					border: '1px solid rgba(16,185,129,0.15)',
					marginBottom: 32,
				}}
			>
				<h1
					style={{
						margin: '0 0 8px 0',
						fontSize: '28px',
						fontWeight: 800,
						background: 'linear-gradient(135deg, #059669, #3b82f6)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						backgroundClip: 'text',
					}}
				>
					Account Settings
				</h1>
				<p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
					Manage your profile information and account security settings.
				</p>
			</header>

			{/* Status Message */}
			{message && (
				<StatusMessage type={messageType} onClose={() => setMessage('')}>
					{message}
				</StatusMessage>
			)}

			{/* Profile Information */}
			<FormCard title="📝 Profile Information" onSubmit={saveProfile}>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
						gap: '20px',
					}}
				>
					<InputField
						label="Username"
						value={profile.username}
						onChange={e => setProfile(prev => ({ ...prev, username: e.target.value }))}
						required
						autoComplete="username"
					/>
					<InputField
						label="Full Name"
						value={profile.fullname}
						onChange={e => setProfile(prev => ({ ...prev, fullname: e.target.value }))}
						required
						autoComplete="name"
					/>
				</div>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
						gap: '20px',
					}}
				>
					<InputField
						label="Email Address"
						type="email"
						value={profile.email}
						onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
						required
						autoComplete="email"
					/>
					<InputField
						label="Phone Number"
						type="tel"
						value={profile.phonenumber}
						onChange={e =>
							setProfile(prev => ({ ...prev, phonenumber: e.target.value }))
						}
						autoComplete="tel"
					/>
				</div>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
						gap: '20px',
					}}
				>
					<InputField
						label="Department"
						value={profile.department}
						onChange={e =>
							setProfile(prev => ({ ...prev, department: e.target.value }))
						}
					/>
					<InputField
						label="Address"
						value={profile.address}
						onChange={e => setProfile(prev => ({ ...prev, address: e.target.value }))}
					/>
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
					<Button type="submit" loading={saving}>
						{saving ? '⏳ Saving Changes...' : '💾 Save Profile'}
					</Button>
				</div>
			</FormCard>

			{/* Password Change */}
			<FormCard title="🔒 Change Password" onSubmit={changePassword}>
				<InputField
					label="Current Password"
					type="password"
					value={passwords.currentPassword}
					onChange={e =>
						setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))
					}
					required
					autoComplete="current-password"
				/>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
						gap: '20px',
					}}
				>
					<InputField
						label="New Password"
						type="password"
						value={passwords.newPassword}
						onChange={e =>
							setPasswords(prev => ({ ...prev, newPassword: e.target.value }))
						}
						required
						minLength={6}
						autoComplete="new-password"
					/>
					<InputField
						label="Confirm New Password"
						type="password"
						value={passwords.confirmPassword}
						onChange={e =>
							setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))
						}
						required
						minLength={6}
						autoComplete="new-password"
					/>
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
					<Button type="submit" variant="secondary" loading={saving}>
						{saving ? '⏳ Changing Password...' : '🔑 Change Password'}
					</Button>
				</div>
			</FormCard>

			{/* Logout Section */}
			<div
				style={{
					background: '#ffffff',
					borderRadius: 18,
					border: '1px solid #fee2e2',
					padding: '28px',
					boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: '20px',
						flexWrap: 'wrap',
					}}
				>
					<div>
						<h3
							style={{
								margin: '0 0 8px 0',
								fontSize: '18px',
								fontWeight: 700,
								color: '#dc2626',
							}}
						>
							🚪 Logout
						</h3>
						<p
							style={{
								margin: 0,
								color: '#6b7280',
								fontSize: '14px',
								lineHeight: 1.5,
							}}
						>
							Sign out from your account on this device. You'll need to login again to
							access your data.
						</p>
					</div>
					<Button variant="danger" onClick={handleLogout}>
						🚪 Logout Now
					</Button>
				</div>
			</div>
		</div>
	);
};

export default StudentSettings;
