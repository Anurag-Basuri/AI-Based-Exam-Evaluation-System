import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { safeApiCall, updateStudentProfile, changeStudentPassword } from '../../services/apiServices.js';

const StudentSettings = () => {
    const { user } = useAuth();
    const [form, setForm] = React.useState({
        username: user?.username || '',
        fullname: user?.fullname || '',
        email: user?.email || '',
        phonenumber: user?.phonenumber || '',
        gender: user?.gender || '',
        address: user?.address || '',
    });
    const [saving, setSaving] = React.useState(false);
    const [pw, setPw] = React.useState({ currentPassword: '', newPassword: '' });
    const [msg, setMsg] = React.useState('');

    const onChange = (k, v) => setForm(s => ({ ...s, [k]: v }));

    const saveProfile = async e => {
        e.preventDefault();
        setSaving(true);
        setMsg('');
        try {
            await safeApiCall(updateStudentProfile, form);
            setMsg('Profile updated');
        } catch (e) {
            setMsg(e?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const changePw = async e => {
        e.preventDefault();
        setSaving(true);
        setMsg('');
        try {
            await safeApiCall(changeStudentPassword, pw);
            setMsg('Password changed');
            setPw({ currentPassword: '', newPassword: '' });
        } catch (e) {
            setMsg(e?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section>
            <h1 style={{ marginTop: 0 }}>Settings</h1>
            {msg && <div style={{ marginBottom: 10, color: '#0ea5e9' }}>{msg}</div>}

            <form onSubmit={saveProfile} style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Profile</h3>
                <div style={gridRow}>
                    <label style={lbl}>Username</label>
                    <input style={inp} value={form.username} onChange={e => onChange('username', e.target.value)} />
                </div>
                <div style={gridRow}>
                    <label style={lbl}>Full name</label>
                    <input style={inp} value={form.fullname} onChange={e => onChange('fullname', e.target.value)} />
                </div>
                <div style={gridRow}>
                    <label style={lbl}>Email</label>
                    <input type="email" style={inp} value={form.email} onChange={e => onChange('email', e.target.value)} />
                </div>
                <div style={gridRow}>
                    <label style={lbl}>Phone</label>
                    <input style={inp} value={form.phonenumber} onChange={e => onChange('phonenumber', e.target.value)} />
                </div>
                <div style={gridRow}>
                    <label style={lbl}>Gender</label>
                    <input style={inp} value={form.gender} onChange={e => onChange('gender', e.target.value)} />
                </div>
                <div style={gridRow}>
                    <label style={lbl}>Address</label>
                    <input style={inp} value={form.address} onChange={e => onChange('address', e.target.value)} />
                </div>
                <div>
                    <button disabled={saving} type="submit" style={btnPrimary}>
                        {saving ? 'Saving…' : 'Save profile'}
                    </button>
                </div>
            </form>

            <form onSubmit={changePw} style={cardStyle}>
                <h3 style={{ marginTop: 0 }}>Change password</h3>
                <div style={gridRow}>
                    <label style={lbl}>Current</label>
                    <input
                        type="password"
                        style={inp}
                        value={pw.currentPassword}
                        onChange={e => setPw(s => ({ ...s, currentPassword: e.target.value }))}
                    />
                </div>
                <div style={gridRow}>
                    <label style={lbl}>New</label>
                    <input
                        type="password"
                        style={inp}
                        value={pw.newPassword}
                        onChange={e => setPw(s => ({ ...s, newPassword: e.target.value }))}
                    />
                </div>
                <div>
                    <button disabled={saving} type="submit" style={btnOutline}>
                        {saving ? 'Changing…' : 'Change password'}
                    </button>
                </div>
            </form>
        </section>
    );
};

const cardStyle = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
};
const gridRow = { display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, marginBottom: 10 };
const lbl = { color: '#475569', paddingTop: 8 };
const inp = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 12px', outline: 'none' };
const btnPrimary = {
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#6366f1',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
};
const btnOutline = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#0f172a',
    cursor: 'pointer',
    fontWeight: 700,
};

export default StudentSettings;