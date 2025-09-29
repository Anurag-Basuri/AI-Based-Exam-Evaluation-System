import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { safeApiCall, updateTeacherProfile, changeTeacherPassword } from '../../services/apiServices.js';

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
            await safeApiCall(updateTeacherProfile, profile);
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
            await safeApiCall(changeTeacherPassword, passwords);
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
                    border: '1px solid rgba(129,140,248,0.25)',
                    background: 'linear-gradient(135deg, rgba(129,140,248,0.18), rgba(59,130,246,0.10))',
                    boxShadow: '0 16px 32px rgba(15,23,42,0.08)',
                    marginBottom: 20,
                }}
            >
                <h1 style={{ margin: 0 }}>Account Settings</h1>
                <p style={{ margin: '6px 0 0', color: '#334155' }}>
                    Update your profile details and manage account security.
                </p>
            </header>

            {message && (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 12,
                        borderRadius: 12,
                        background: '#dbeafe',
                        border: '1px solid #bfdbfe',
                        color: '#1e40af',
                    }}
                >
                    {message}
                </div>
            )}

            <form
                onSubmit={saveProfile}
                style={{
                    background: '#ffffff',
                    borderRadius: 18,
                    border: '1px solid #e2e8f0',
                    padding: 20,
                    marginBottom: 20,
                    boxShadow: '0 12px 28px rgba(15,23,42,0.06)',
                    display: 'grid',
                    gap: 14,
                }}
            >
                <h3 style={{ margin: 0 }}>Profile information</h3>
                {{
                    username: 'Username',
                    fullname: 'Full name',
                    email: 'Email',
                    phonenumber: 'Phone',
                    department: 'Department',
                    address: 'Address',
                }}
                {Object.entries({
                    username: 'Username',
                    fullname: 'Full name',
                    email: 'Email',
                    phonenumber: 'Phone',
                    department: 'Department',
                    address: 'Address',
                }).map(([key, label]) => (
                    <label key={key} style={{ display: 'grid', gap: 6 }}>
                        <span style={{ color: '#475569', fontWeight: 700 }}>{label}</span>
                        <input
                            type={key === 'email' ? 'email' : 'text'}
                            value={profile[key]}
                            onChange={e => onProfileChange(key, e.target.value)}
                            style={{
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: '1px solid #cbd5e1',
                                outline: 'none',
                                background: '#f8fafc',
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
                            background: '#6366f1',
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
                    background: '#ffffff',
                    borderRadius: 18,
                    border: '1px solid #e2e8f0',
                    padding: 20,
                    boxShadow: '0 12px 28px rgba(15,23,42,0.06)',
                    display: 'grid',
                    gap: 14,
                }}
            >
                <h3 style={{ margin: 0 }}>Security</h3>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={{ color: '#475569', fontWeight: 700 }}>Current password</span>
                    <input
                        type="password"
                        value={passwords.currentPassword}
                        onChange={e => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                        style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1px solid #cbd5e1',
                            outline: 'none',
                            background: '#f8fafc',
                        }}
                    />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                    <span style={{ color: '#475569', fontWeight: 700 }}>New password</span>
                    <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={e => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                        style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1px solid #cbd5e1',
                            outline: 'none',
                            background: '#f8fafc',
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
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#4338ca',
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