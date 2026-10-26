import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Field, Avatar, Badge } from '../components/ui.jsx';
import { capitalize, formatDate, getError } from '../utils/format.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [info, setInfo] = useState({ name: user.name, phone: user.phone || '', address: user.address || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const saveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/me', info);
      setUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const savePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match');
    try {
      await api.put('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your account details and password." />
      <div className="profile-header card">
        <Avatar name={user.name} size={72} />
        <div className="profile-header-main">
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          <div className="chip-row">
            <Badge tone="teal">{capitalize(user.role)}</Badge>
            {user.position && <Badge tone="blue">{user.position}</Badge>}
            <span className="muted small">Member since {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="grid-2">
        <form className="card form" onSubmit={saveInfo}>
          <h3>Personal information</h3>
          <Field label="Full name" required><input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} required /></Field>
          <Field label="Phone"><input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} /></Field>
          <Field label="Address"><input value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} /></Field>
          <button type="submit" className="btn btn-primary" disabled={saving}>Save changes</button>
        </form>
        <form className="card form" onSubmit={savePw}>
          <h3>Change password</h3>
          <Field label="Current password" required><input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required /></Field>
          <Field label="New password" required hint="At least 6 characters"><input type="password" minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required /></Field>
          <Field label="Confirm new password" required><input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></Field>
          <button type="submit" className="btn btn-primary">Update password</button>
        </form>
      </div>
    </div>
  );
}