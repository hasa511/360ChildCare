import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUsers } from 'react-icons/fi';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { PageHeader, Spinner, ErrorBox, EmptyState, Field, Badge, Avatar } from '../components/ui.jsx';
import { capitalize, formatDate, getError } from '../utils/format.js';

const roleTone = { admin: 'purple', staff: 'blue', parent: 'teal' };

function UserForm({ open, onClose, editUser, onSaved }) {
  const blank = { name: '', email: '', role: 'parent', phone: '', position: '', address: '', password: '', isActive: true };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(editUser ? { ...blank, ...editUser, password: '' } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editUser]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { name, email, role, phone, position, address, password, isActive } = form;
    const payload = { name, email, role, phone, position, address, isActive, ...(password ? { password } : {}) };
    try {
      if (editUser) await api.put(`/users/${editUser._id}`, payload);
      else await api.post('/users', payload);
      toast.success(editUser ? 'User updated' : 'User created');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editUser ? 'Edit user' : 'Add user'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="user-form" className="btn btn-primary" disabled={saving}>Save</button>
        </>
      }
    >
      <form id="user-form" className="form" onSubmit={submit}>
        <div className="form-row">
          <Field label="Full name" required><input value={form.name} onChange={set('name')} required /></Field>
          <Field label="Email" required><input type="email" value={form.email} onChange={set('email')} required /></Field>
        </div>
        <div className="form-row">
          <Field label="Role" required>
            <select value={form.role} onChange={set('role')}>
              <option value="parent">Parent</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Phone"><input value={form.phone} onChange={set('phone')} /></Field>
        </div>
        {form.role !== 'parent' && <Field label="Position / job title"><input value={form.position} onChange={set('position')} placeholder="e.g. Lead Teacher" /></Field>}
        <Field label="Address"><input value={form.address} onChange={set('address')} /></Field>
        <Field label={editUser ? 'New password (leave blank to keep)' : 'Password'} required={!editUser} hint="At least 6 characters">
          <input type="password" minLength={6} value={form.password} onChange={set('password')} required={!editUser} />
        </Field>
        <label className="checkbox">
          <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
          <span>Account active</span>
        </label>
      </form>
    </Modal>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const params = Object.fromEntries(Object.entries({ role, search }).filter(([, v]) => v));
  const { data, loading, error, reload } = useFetch('/users', params);
  const users = data?.data || [];

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? They will be unlinked from children and classrooms.`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      toast.success('User deleted');
      reload(true);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage administrators, staff and parent accounts."
        actions={<button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><FiPlus /> Add user</button>}
      />
      <div className="toolbar">
        <div className="search-input">
          <FiSearch />
          <input placeholder="Search name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="pill-group">
          {['', 'admin', 'staff', 'parent'].map((r) => (
            <button type="button" key={r || 'all'} className={role === r ? 'pill active' : 'pill'} onClick={() => setRole(r)}>
              {r ? `${capitalize(r)}s` : 'All'}
            </button>
          ))}
        </div>
      </div>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && users.length === 0 && <EmptyState icon={FiUsers} title="No users found" />}
      {users.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Joined</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="row-link">
                      <Avatar name={u.name} size={34} />
                      <div><strong>{u.name}</strong><div className="muted small">{u.email}</div></div>
                    </div>
                  </td>
                  <td><Badge tone={roleTone[u.role]}>{u.role}</Badge>{u.position && <div className="muted small">{u.position}</div>}</td>
                  <td>{u.phone || '—'}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td><Badge tone={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td>
                    <div className="row-actions end">
                      <button type="button" className="icon-btn" onClick={() => { setEditing(u); setFormOpen(true); }} aria-label="Edit"><FiEdit2 /></button>
                      {u._id !== me._id && <button type="button" className="icon-btn danger" onClick={() => remove(u)} aria-label="Delete"><FiTrash2 /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <UserForm open={formOpen} onClose={() => setFormOpen(false)} editUser={editing} onSaved={() => reload(true)} />
    </div>
  );
}