import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import {
	safeApiCall,
	updateStudentProfile,
	changeStudentPassword,
	logoutStudentApi,
} from '../../services/apiServices.js';

const StudentSettings = () => {
	const { user } = useAuth();
	const [saving, setSaving] = React.useState(false);
	const [msg, setMsg] = React.useState('');

	const [profile, setProfile] = React.useState({
		username: user?.username || '',
		email: user?.email || '',
	});

	const [pw, setPw] = React.useState({
		oldPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const saveProfile = async e => {
		e.preventDefault();
		setSaving(true);
		setMsg('');
		try {
			await safeApiCall(updateStudentProfile, profile);
			setMsg('Profile updated successfully.');
		} catch (e) {
			setMsg(e.message || 'Failed to update profile');
		} finally {
			setSaving(false);
		}
	};

	const changePw = async e => {
		e.preventDefault();
		if (!pw.newPassword || pw.newPassword !== pw.confirmPassword) {
			setMsg('Passwords do not match.');
			return;
		}
		setSaving(true);
		setMsg('');
		try {
			await safeApiCall(changeStudentPassword, {
				currentPassword: pw.oldPassword,
				newPassword: pw.newPassword,
			});
			setMsg('Password changed successfully.');
			setPw({ oldPassword: '', newPassword: '', confirmPassword: '' });
		} catch (e) {
			setMsg(e.message || 'Failed to change password');
		} finally {
			setSaving(false);
		}
	};

	const handleLogoutAll = async () => {
		try {
			await safeApiCall(logoutStudentApi);
			window.location.href = '/';
		} catch (e) {
			setMsg(e.message || 'Failed to logout');
		}
	};

	return (
		<section style={{ color: 'var(--text)' }}>
			<h1 style={{ marginTop: 0 }}>Settings</h1>
			{msg && <div style={{ marginBottom: 10, color: 'var(--primary)' }}>{msg}</div>}

			<form onSubmit={saveProfile} style={cardStyle}>
				<div style={gridRow}>
					<label style={lbl}>Username</label>
					<input
						value={profile.username}
						onChange={e => setProfile(s => ({ ...s, username: e.target.value }))}
						style={inp}
						required
					/>
				</div>
				<div style={gridRow}>
					<label style={lbl}>Email</label>
					<input
						type="email"
						value={profile.email}
						onChange={e => setProfile(s => ({ ...s, email: e.target.value }))}
						style={inp}
						required
					/>
				</div>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<button disabled={saving} type="submit" style={btnPrimary}>
						{saving ? 'Saving…' : 'Save profile'}
					</button>
				</div>
			</form>

			<form onSubmit={changePw} style={cardStyle}>
				<div style={gridRow}>
					<label style={lbl}>Current password</label>
					<input
						type="password"
						value={pw.oldPassword}
						onChange={e => setPw(s => ({ ...s, oldPassword: e.target.value }))}
						style={inp}
						required
					/>
				</div>
				<div style={gridRow}>
					<label style={lbl}>New password</label>
					<input
						type="password"
						value={pw.newPassword}
						onChange={e => setPw(s => ({ ...s, newPassword: e.target.value }))}
						style={inp}
						required
					/>
				</div>
				<div style={gridRow}>
					<label style={lbl}>Confirm new password</label>
					<input
						type="password"
						value={pw.confirmPassword}
						onChange={e => setPw(s => ({ ...s, confirmPassword: e.target.value }))}
						style={inp}
						required
					/>
				</div>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<button disabled={saving} type="submit" style={btnOutline}>
						{saving ? 'Changing…' : 'Change password'}
					</button>
				</div>
			</form>

			<div style={cardStyle}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<div>
						<div style={{ fontWeight: 700, color: 'var(--text)' }}>Logout</div>
						<div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
							Sign out from this device
						</div>
					</div>
					<button onClick={handleLogoutAll} style={btnOutline}>
						Logout
					</button>
				</div>
			</div>
		</section>
	);
};

const cardStyle = {
	background: 'var(--surface)',
	border: '1px solid var(--border)',
	borderRadius: 12,
	padding: 12,
	marginBottom: 16,
};
const gridRow = { display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, marginBottom: 10 };
const lbl = { color: 'var(--text-muted)', paddingTop: 8 };
const inp = {
	border: '1px solid var(--border)',
	background: 'var(--surface)',
	color: 'var(--text)',
	borderRadius: 8,
	padding: '10px 12px',
	outline: 'none',
};
const btnPrimary = {
	padding: '8px 12px',
	borderRadius: 8,
	border: 'none',
	background: 'var(--primary)',
	color: '#fff',
	cursor: 'pointer',
	fontWeight: 700,
};
const btnOutline = {
	padding: '8px 12px',
	borderRadius: 8,
	border: '1px solid var(--border)',
	background: 'var(--surface)',
	color: 'var(--text)',
	cursor: 'pointer',
	fontWeight: 700,
};

export default StudentSettings;
