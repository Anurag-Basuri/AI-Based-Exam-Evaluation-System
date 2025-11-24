import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import {
	safeApiCall,
	updateTeacherProfile,
	changeTeacherPassword,
} from '../../services/teacherServices.js';
import './Settings.css';

const TeacherSettings = () => {
	const { user } = useAuth();

    // Initial state structure matching the backend schema
    const initialProfileState = {
		username: '',
		fullname: '',
		email: '',
		phonenumber: '',
		department: '',
        // Address is a subdocument, must be initialized as object
		address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: ''
        },
	};

	const [profile, setProfile] = useState(initialProfileState);
    const [originalProfile, setOriginalProfile] = useState(initialProfileState);
    const [isDirty, setIsDirty] = useState(false);

    // Load user data
    useEffect(() => {
        if (user) {
            // Helper to safely parse address
            const parseAddress = (addr) => {
                if (!addr) return { street: '', city: '', state: '', postalCode: '', country: '' };
                if (typeof addr === 'string') return { street: addr, city: '', state: '', postalCode: '', country: '' };
                return {
                    street: addr.street || '',
                    city: addr.city || '',
                    state: addr.state || '',
                    postalCode: addr.postalCode || '',
                    country: addr.country || '',
                };
            };

            const loadedProfile = {
                username: user.username || '',
                fullname: user.fullname || '',
                email: user.email || '',
                phonenumber: user.phonenumber || '',
                department: user.department || '',
                address: parseAddress(user.address),
            };
            setProfile(loadedProfile);
            setOriginalProfile(loadedProfile);
        }
    }, [user]);

    // Check for changes
    useEffect(() => {
        const isChanged = JSON.stringify(profile) !== JSON.stringify(originalProfile);
        setIsDirty(isChanged);
    }, [profile, originalProfile]);

	const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState({ type: '', text: '' });

    // Auto-dismiss message
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

	const saveProfile = async e => {
		e.preventDefault();
        if (!isDirty) return;

		setSaving(true);
		setMessage({ type: '', text: '' });
		try {
            // Calculate changed fields only
            const payload = {};
            
            // Top-level fields
            ['username', 'fullname', 'email', 'department'].forEach(key => {
                if (profile[key] !== originalProfile[key]) {
                    payload[key] = (profile[key] || '').trim();
                }
            });

            // Phone number: handle empty string as null to satisfy sparse index/validator
            if (profile.phonenumber !== originalProfile.phonenumber) {
                const phone = (profile.phonenumber || '').trim();
                payload.phonenumber = phone === '' ? null : phone;
            }

            // Address: send full object if any part changed
            const addressChanged = JSON.stringify(profile.address) !== JSON.stringify(originalProfile.address);
            if (addressChanged) {
                payload.address = {
                    street: (profile.address.street || '').trim(),
                    city: (profile.address.city || '').trim(),
                    state: (profile.address.state || '').trim(),
                    postalCode: (profile.address.postalCode || '').trim(),
                    country: (profile.address.country || '').trim(),
                };
            }

            if (Object.keys(payload).length === 0) {
                setSaving(false);
                return;
            }

			await safeApiCall(updateTeacherProfile, payload);
            
            // Update original profile to match new state
            setOriginalProfile(JSON.parse(JSON.stringify(profile)));
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

	const onProfileChange = (key, value) => {
        setProfile(prev => ({ ...prev, [key]: value }));
    };

    const onAddressChange = (key, value) => {
        setProfile(prev => ({
            ...prev,
            address: {
                ...(prev.address || {}), // Ensure prev.address is an object
                [key]: value
            }
        }));
    };

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

                    <div className="section-divider" style={{ margin: '16px 0', borderTop: '1px solid var(--border)' }}></div>
                    <h3 className="form-label" style={{ fontSize: '1rem', marginBottom: '16px' }}>Address Details</h3>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Street</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.address.street}
                                onChange={e => onAddressChange('street', e.target.value)}
                                placeholder="123 Campus Dr"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.address.city}
                                onChange={e => onAddressChange('city', e.target.value)}
                                placeholder="New York"
                            />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">State / Province</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.address.state}
                                onChange={e => onAddressChange('state', e.target.value)}
                                placeholder="NY"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Postal Code</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.address.postalCode}
                                onChange={e => onAddressChange('postalCode', e.target.value)}
                                placeholder="10001"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Country</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.address.country}
                                onChange={e => onAddressChange('country', e.target.value)}
                                placeholder="USA"
                            />
                        </div>
                    </div>

					<div className="form-actions">
						<button 
                            type="submit" 
                            className="btn-save" 
                            disabled={saving || !isDirty}
                            title={!isDirty ? "No changes to save" : "Save changes"}
                        >
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
