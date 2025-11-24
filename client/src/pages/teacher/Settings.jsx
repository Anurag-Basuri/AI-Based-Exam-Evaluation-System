import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import {
	safeApiCall,
	updateTeacherProfile,
	changeTeacherPassword,
} from '../../services/teacherServices.js';
import './Settings.css';

const TeacherSettings = () => {
	const { user, login } = useAuth(); // Assuming login updates the user context
	
    // Initialize state with user data or defaults
	const [profile, setProfile] = useState({
		username: '',
		fullname: '',
		email: '',
		phonenumber: '',
		department: '',
		address: '',
	});

    // Load user data into state when user object is available
    useEffect(() => {
        if (user) {
            setProfile({
                username: user.username || '',
                fullname: user.fullname || '',
                email: user.email || '',
                phonenumber: user.phonenumber || '',
                department: user.department || '',
                address: typeof user.address === 'string' ? user.address : '', // Handle address if it's an object in future
            });
        }
    }, [user]);

	const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState({ type: '', text: '' });

    // Clear message after 5 seconds
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

	const saveProfile = async e => {
		e.preventDefault();
		setSaving(true);
		setMessage({ type: '', text: '' });
		try {
            // Clean up payload
			const payload = Object.fromEntries(
				Object.entries(profile).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
			);
            
			const updatedUser = await safeApiCall(updateTeacherProfile, payload);
            
            // Update local user context if possible (assuming login/updateUser function exists)
            // If useAuth doesn't expose a way to update user without reload, we might need to reload or just rely on the response
            
			setMessage({ type: 'success', text: 'Profile updated successfully.' });
		} catch (err) {
			setMessage({ type: 'error', text: err?.message || 'Failed to update profile.' });
		} finally {
			setSaving(false);
		}
	};

	const changePassword = async e => {
		e.preventDefault();
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

		setSaving(true);
		setMessage({ type: '', text: '' });
		try {
			const payload = {
				currentPassword: passwords.currentPassword,
				newPassword: passwords.newPassword.trim(),
			};
			await safeApiCall(changeTeacherPassword, payload);
			setMessage({ type: 'success', text: 'Password changed successfully.' });
			setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
		} catch (err) {
			setMessage({ type: 'error', text: err?.message || 'Failed to change password.' });
		} finally {
			setSaving(false);
		}
	};

	const onProfileChange = (key, value) => setProfile(prev => ({ ...prev, [key]: value }));

	return (
		<div className="settings-container">
			<header className="settings-header">
				<h1 className="settings-title">Account Settings</h1>
				<p className="settings-subtitle">
					Manage your personal information and account security.
				</p>
			</header>

			{message.text && (
				<div className={`settings-alert ${message.type}`}>
                    {message.type === 'success' ? '✅' : '⚠️'} {message.text}
				</div>
			)}

            {/* --- Profile Section --- */}
			<section className="settings-section">
                <div className="section-header">
                    <h2 className="section-title">Personal Information</h2>
                    <p className="section-desc">Update your public profile and contact details.</p>
                </div>

				<form onSubmit={saveProfile} className="settings-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.username}
                                onChange={e => onProfileChange('username', e.target.value)}
                                placeholder="jdoe"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.fullname}
                                onChange={e => onProfileChange('fullname', e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={profile.email}
                                onChange={e => onProfileChange('email', e.target.value)}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number <span className="form-hint">(Optional)</span></label>
                            <input
                                type="tel"
                                className="form-input"
                                value={profile.phonenumber}
                                onChange={e => onProfileChange('phonenumber', e.target.value)}
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Department <span className="form-hint">(Optional)</span></label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.department}
                                onChange={e => onProfileChange('department', e.target.value)}
                                placeholder="Computer Science"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Address <span className="form-hint">(Optional)</span></label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.address}
                                onChange={e => onProfileChange('address', e.target.value)}
                                placeholder="123 Campus Dr, City, State"
                            />
                        </div>
                    </div>

					<div className="form-actions">
						<button type="submit" className="btn-save" disabled={saving}>
							{saving ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</form>
			</section>

            {/* --- Security Section --- */}
			<section className="settings-section">
                <div className="section-header">
                    <h2 className="section-title">Security</h2>
                    <p className="section-desc">Ensure your account is secure by using a strong password.</p>
                </div>

				<form onSubmit={changePassword} className="settings-form">
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={passwords.currentPassword}
                            onChange={e => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={passwords.newPassword}
                                onChange={e => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                                required
                                minLength={8}
                                placeholder="Min. 8 characters"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={passwords.confirmPassword}
                                onChange={e => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

					<div className="form-actions">
						<button type="submit" className="btn-save" disabled={saving}>
							{saving ? 'Updating...' : 'Update Password'}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
};

export default TeacherSettings;
