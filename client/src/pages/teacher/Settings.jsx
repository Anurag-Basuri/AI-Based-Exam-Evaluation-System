import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import {
	safeApiCall,
	updateTeacherProfile,
	changeTeacherPassword,
	exportTeacherProfileCsv,
	exportTeacherExamsCsv
} from '../../services/teacherServices.js';
import { resendVerification } from '../../services/apiServices.js';
import { downloadFile } from '../../utils/exportUtils.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { User, Shield, Download, Mail, Phone, MapPin, CheckCircle, AlertTriangle, RefreshCcw, Building2 } from 'lucide-react';

const TeacherSettings = () => {
	const { user, isEmailVerified } = useAuth();

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

	const [resending, setResending] = useState(false);

	const handleResendVerification = async () => {
		setResending(true);
		setMessage({ type: '', text: '' });
		try {
			await resendVerification();
			setMessage({ type: 'success', text: 'Verification email sent. Please check your inbox.' });
		} catch (err) {
			setMessage({ type: 'error', text: err?.message || 'Failed to send verification email.' });
		} finally {
			setResending(false);
		}
	};

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
				...(prev.address || {}),
				[key]: value
			}
		}));
	};

	const inputCls = "w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium placeholder:text-[var(--text-muted)]/50";

	return (
		<div className="min-h-screen bg-[var(--bg)] pb-20 dash-enter">
			<PageHeader
				title="Account Settings"
				subtitle="Manage your personal information and account security."
				breadcrumbs={[
					{ label: 'Home', to: '/teacher' },
					{ label: 'Settings' }
				]}
			/>

			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
				{message.text && (
					<div className="mb-6">
						<Alert type={message.type} onClose={() => setMessage({ type: '', text: '' })}>
							{message.text}
						</Alert>
					</div>
				)}

				<div className="space-y-8">
					{/* --- Profile Section --- */}
					<section className="glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border)] relative overflow-hidden group">
						<div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
							<User className="w-48 h-48" />
						</div>

						<div className="relative z-10">
							<div className="mb-8">
								<h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2 mb-2">
									<User className="w-6 h-6 text-indigo-500" />
									Personal Information
								</h2>
								<p className="text-[var(--text-muted)] font-medium">Update your public profile and contact details.</p>
							</div>

							<form onSubmit={saveProfile} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<label className="text-sm font-bold text-[var(--text)]">Username</label>
										<input type="text" className={inputCls} value={profile.username} onChange={e => onProfileChange('username', e.target.value)} placeholder="jdoe" />
									</div>
									<div className="space-y-2">
										<label className="text-sm font-bold text-[var(--text)]">Full Name</label>
										<input type="text" className={inputCls} value={profile.fullname} onChange={e => onProfileChange('fullname', e.target.value)} placeholder="John Doe" />
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<label className="text-sm font-bold text-[var(--text)] flex justify-between items-center">
											<span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> Email Address</span>
											{isEmailVerified ? (
												<span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
													<CheckCircle className="w-3.5 h-3.5" /> Verified
												</span>
											) : (
												<span className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-bold">
													<span className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">
														<AlertTriangle className="w-3.5 h-3.5" /> Not Verified
													</span>
													<button
														type="button"
														onClick={handleResendVerification}
														disabled={resending}
														className="hover:underline opacity-80 hover:opacity-100 disabled:opacity-50"
													>
														{resending ? 'Sending...' : 'Resend Link'}
													</button>
												</span>
											)}
										</label>
										<input type="email" className={inputCls} value={profile.email} onChange={e => onProfileChange('email', e.target.value)} placeholder="john@example.com" required />
									</div>
									<div className="space-y-2">
										<label className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
											<Phone className="w-4 h-4" /> Phone Number <span className="text-[var(--text-muted)] font-normal text-xs ml-1">(Optional)</span>
										</label>
										<input type="tel" className={inputCls} value={profile.phonenumber} onChange={e => onProfileChange('phonenumber', e.target.value)} placeholder="+1 234 567 8900" />
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
										<Building2 className="w-4 h-4" /> Department <span className="text-[var(--text-muted)] font-normal text-xs ml-1">(Optional)</span>
									</label>
									<input type="text" className={inputCls} value={profile.department} onChange={e => onProfileChange('department', e.target.value)} placeholder="Computer Science" />
								</div>

								<div className="pt-6 border-t border-[var(--border)]">
									<h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2 mb-4">
										<MapPin className="w-5 h-5 text-indigo-500" /> Address Details
									</h3>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
										<div className="space-y-2">
											<label className="text-sm font-bold text-[var(--text)]">Street</label>
											<input type="text" className={inputCls} value={profile.address.street} onChange={e => onAddressChange('street', e.target.value)} placeholder="123 Campus Dr" />
										</div>
										<div className="space-y-2">
											<label className="text-sm font-bold text-[var(--text)]">City</label>
											<input type="text" className={inputCls} value={profile.address.city} onChange={e => onAddressChange('city', e.target.value)} placeholder="New York" />
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
										<div className="space-y-2">
											<label className="text-sm font-bold text-[var(--text)]">State / Province</label>
											<input type="text" className={inputCls} value={profile.address.state} onChange={e => onAddressChange('state', e.target.value)} placeholder="NY" />
										</div>
										<div className="space-y-2">
											<label className="text-sm font-bold text-[var(--text)]">Postal Code</label>
											<input type="text" className={inputCls} value={profile.address.postalCode} onChange={e => onAddressChange('postalCode', e.target.value)} placeholder="10001" />
										</div>
										<div className="space-y-2">
											<label className="text-sm font-bold text-[var(--text)]">Country</label>
											<input type="text" className={inputCls} value={profile.address.country} onChange={e => onAddressChange('country', e.target.value)} placeholder="USA" />
										</div>
									</div>
								</div>

								<div className="flex justify-end pt-4">
									<button
										type="submit"
										className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
										disabled={saving || !isDirty}
									>
										{saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : null}
										{saving ? 'Saving...' : 'Save Changes'}
									</button>
								</div>
							</form>
						</div>
					</section>

					{/* --- Security Section --- */}
					<section className="glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border)] relative overflow-hidden group">
						<div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
							<Shield className="w-48 h-48" />
						</div>

						<div className="relative z-10">
							<div className="mb-8">
								<h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2 mb-2">
									<Shield className="w-6 h-6 text-indigo-500" />
									Security
								</h2>
								<p className="text-[var(--text-muted)] font-medium">Ensure your account is secure by using a strong password.</p>
							</div>

							<form onSubmit={changePassword} className="space-y-6">
								<div className="space-y-2 max-w-md">
									<label className="text-sm font-bold text-[var(--text)]">Current Password</label>
									<input type="password" className={inputCls} value={passwords.currentPassword} onChange={e => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))} required placeholder="••••••••" />
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<label className="text-sm font-bold text-[var(--text)]">New Password</label>
										<input type="password" className={inputCls} value={passwords.newPassword} onChange={e => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))} required minLength={8} placeholder="Min. 8 characters" />
									</div>
									<div className="space-y-2">
										<label className="text-sm font-bold text-[var(--text)]">Confirm New Password</label>
										<input type="password" className={inputCls} value={passwords.confirmPassword} onChange={e => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))} required placeholder="••••••••" />
									</div>
								</div>

								<div className="flex justify-end pt-4">
									<button
										type="submit"
										className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
										disabled={saving || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
									>
										{saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : null}
										{saving ? 'Updating...' : 'Update Password'}
									</button>
								</div>
							</form>
						</div>
					</section>

					{/* --- Data Export Section --- */}
					<section className="glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border)]">
						<div className="mb-8">
							<h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2 mb-2">
								<Download className="w-6 h-6 text-indigo-500" />
								Data Export
							</h2>
							<p className="text-[var(--text-muted)] font-medium">Download a copy of your personal data and complete exam portfolio.</p>
						</div>

						<div className="flex flex-wrap gap-4">
							<button
								type="button"
								className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--border)] text-[var(--text)] font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm active:scale-95"
								onClick={async () => {
									try {
										const data = await exportTeacherProfileCsv();
										downloadFile(data, 'teacher_profile.csv');
									} catch (err) {
										setMessage({ type: 'error', text: 'Failed to download profile CSV.' });
									}
								}}
							>
								<Download className="w-4 h-4" /> Export Profile Data
							</button>

							<button
								type="button"
								className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--border)] text-[var(--text)] font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm active:scale-95"
								onClick={async () => {
									try {
										const data = await exportTeacherExamsCsv();
										downloadFile(data, 'teacher_exams.csv');
									} catch (err) {
										setMessage({ type: 'error', text: 'Failed to download exams CSV.' });
									}
								}}
							>
								<Download className="w-4 h-4" /> Export All Created Exams
							</button>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
};

export default TeacherSettings;
