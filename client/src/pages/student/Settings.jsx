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
        <section style={{ color: 'var(--text)' }}>
            <h1 style={{ marginTop: 0 }}>Settings</h1>
            {msg && <div style={{ marginBottom: 10, color: 'var(--primary)' }}>{msg}</div>}

            <form onSubmit={saveProfile} style={cardStyle}>
                <h3 style={{ marginTop: 0, marginBottom: 10 }}>Profile</h3>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button disabled={saving} type="submit" style={btnPrimary}>
                        {saving ? 'Saving…' : 'Save profile'}
                    </button>
                </div>
            </form>

            <form onSubmit={changePw} style={cardStyle}>
                <h3 style={{ marginTop: 0, marginBottom: 10 }}>Change password</h3>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button disabled={saving} type="submit" style={btnOutline}>
                        {saving ? 'Changing…' : 'Change password'}
                    </button>
                </div>
            </form>
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