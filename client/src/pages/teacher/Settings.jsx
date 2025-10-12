import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import {
	safeApiCall,
	updateTeacherProfile,
	changeTeacherPassword,
} from '../../services/teacherServices.js';

const TeacherSettings = () => {
	const { user } = useAuth();
	const [profile, setProfile] = React.useState({
		username: user?.username || '',
		fullname: user?.fullname || '',
		email: user?.email || '',
		phonenumber: user?.phonenumber || '',
		department: user?.department || '',
		address: user?.address || '',
	});
	const [passwords, setPasswords] = React.useState({ currentPassword: '', newPassword: '' });
	const [saving, setSaving] = React.useState(false);
	const [message, setMessage] = React.useState('');

	const saveProfile = async e => {
		e.preventDefault();
		setSaving(true);
		setMessage('');
		try {
			const payload = Object.fromEntries(
				Object.entries(profile).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
			);
			await safeApiCall(updateTeacherProfile, payload);
			setMessage('Profile updated successfully.');
		} catch (err) {
			setMessage(err?.message || 'Failed to update profile.');
		} finally {
			setSaving(false);
		}
	};

	const changePassword = async e => {
		e.preventDefault();
		setSaving(true);
		setMessage('');
		try {
			const payload = {
				currentPassword: passwords.currentPassword,
				newPassword: passwords.newPassword.trim(),
			};
			await safeApiCall(changeTeacherPassword, payload);
			setMessage('Password changed successfully.');
			setPasswords({ currentPassword: '', newPassword: '' });
		} catch (err) {
			setMessage(err?.message || 'Failed to change password.');
		} finally {
			setSaving(false);
		}
	};

	const onProfileChange = (key, value) => setProfile(prev => ({ ...prev, [key]: value }));

	return (
		<section>
			<header
				style={{
					padding: 18,
					borderRadius: 16,
					border: '1px solid var(--border)',
					background:
						'linear-gradient(135deg, color-mix(in srgb, #818cf8 12%, transparent), color-mix(in srgb, #3b82f6 6%, transparent))',
					boxShadow: 'var(--shadow-md)',
					marginBottom: 20,
					color: 'var(--text)',
				}}
			>
				<h1 style={{ margin: 0 }}>Account Settings</h1>
				<p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
					Update your profile details and manage account security.
				</p>
			</header>

			{message && (
				<div
					aria-live="polite"
					style={{
						marginBottom: 16,
						padding: 12,
						borderRadius: 12,
						background: 'var(--surface)',
						border: '1px solid var(--border)',
						color: 'var(--text)',
					}}
				>
					{message}
				</div>
			)}

			<form
				onSubmit={saveProfile}
				style={{
					background: 'var(--surface)',
					borderRadius: 18,
					border: '1px solid var(--border)',
					padding: 20,
					marginBottom: 20,
					boxShadow: 'var(--shadow-md)',
					display: 'grid',
					gap: 14,
					color: 'var(--text)',
				}}
			>
				<h3 style={{ margin: 0 }}>Profile information</h3>
				{Object.entries({
					username: 'Username',
					fullname: 'Full name',
					email: 'Email',
					phonenumber: 'Phone',
					department: 'Department',
					address: 'Address',
				}).map(([key, label]) => (
					<label key={key} style={{ display: 'grid', gap: 6 }}>
						<span style={{ color: 'var(--text)', fontWeight: 700 }}>{label}</span>
						<input
							name={key}
							type={key === 'email' ? 'email' : 'text'}
							value={profile[key]}
							onChange={e => onProfileChange(key, e.target.value)}
							autoComplete={key}
							style={{
								padding: '10px 12px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								outline: 'none',
								background: 'var(--bg)',
								color: 'var(--text)',
							}}
						/>
					</label>
				))}
				<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
					<button
						type="submit"
						disabled={saving}
						style={{
							padding: '10px 16px',
							borderRadius: 12,
							border: 'none',
							background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
							color: '#ffffff',
							fontWeight: 700,
							cursor: 'pointer',
							boxShadow: '0 14px 28px rgba(99,102,241,0.25)',
							opacity: saving ? 0.7 : 1,
						}}
					>
						{saving ? 'Saving…' : 'Save changes'}
					</button>
				</div>
			</form>

			<form
				onSubmit={changePassword}
				style={{
					background: 'var(--surface)',
					borderRadius: 18,
					border: '1px solid var(--border)',
					padding: 20,
					boxShadow: 'var(--shadow-md)',
					display: 'grid',
					gap: 14,
					color: 'var(--text)',
				}}
			>
				<h3 style={{ margin: 0 }}>Security</h3>
				<label style={{ display: 'grid', gap: 6 }}>
					<span style={{ color: 'var(--text)', fontWeight: 700 }}>Current password</span>
					<input
						name="currentPassword"
						type="password"
						value={passwords.currentPassword}
						onChange={e =>
							setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))
						}
						required
						style={{
							padding: '10px 12px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							outline: 'none',
							background: 'var(--bg)',
							color: 'var(--text)',
						}}
					/>
				</label>
				<label style={{ display: 'grid', gap: 6 }}>
					<span style={{ color: 'var(--text)', fontWeight: 700 }}>New password</span>
					<input
						name="newPassword"
						type="password"
						value={passwords.newPassword}
						onChange={e =>
							setPasswords(prev => ({ ...prev, newPassword: e.target.value }))
						}
						required
						style={{
							padding: '10px 12px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							outline: 'none',
							background: 'var(--bg)',
							color: 'var(--text)',
						}}
					/>
				</label>
				<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
					<button
						type="submit"
						disabled={saving}
						style={{
							padding: '10px 16px',
							borderRadius: 12,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							fontWeight: 700,
							cursor: 'pointer',
							opacity: saving ? 0.7 : 1,
						}}
					>
						{saving ? 'Updating…' : 'Change password'}
					</button>
				</div>
			</form>
		</section>
	);
};

export default TeacherSettings;
