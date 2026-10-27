import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiGrid, FiUsers } from 'react-icons/fi';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { PageHeader, Spinner, ErrorBox, EmptyState, Field, Badge, Avatar } from '../components/ui.jsx';
import { formatCurrency, getError, calcAge, childName } from '../utils/format.js';

const empty = { name: '', ageGroup: '', capacity: 15, monthlyFee: 0, roomNumber: '', description: '', staff: [] };

function ClassroomForm({ open, onClose, room, onSaved }) {
  const [form, setForm] = useState(empty);
  const [staffList, setStaffList] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(room ? { ...empty, ...room, staff: room.staff.map((s) => s._id) } : empty);
    api.get('/users', { params: { role: 'staff' } }).then((r) => setStaffList(r.data.data)).catch(() => {});
  }, [open, room]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (id) =>
    setForm({ ...form, staff: form.staff.includes(id) ? form.staff.filter((s) => s !== id) : [...form.staff, id] });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name, ageGroup: form.ageGroup, capacity: Number(form.capacity), monthlyFee: Number(form.monthlyFee),
      roomNumber: form.roomNumber, description: form.description, staff: form.staff,
    };
    try {
      if (room) await api.put(`/classrooms/${room._id}`, payload);
      else await api.post('/classrooms', payload);
      toast.success(room ? 'Classroom updated' : 'Classroom created');
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
      title={room ? 'Edit classroom' : 'New classroom'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="room-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </>
      }
    >
      <form id="room-form" className="form" onSubmit={submit}>
        <div className="form-row">
          <Field label="Name" required><input value={form.name} onChange={set('name')} required /></Field>
          <Field label="Room number"><input value={form.roomNumber} onChange={set('roomNumber')} /></Field>
        </div>
        <Field label="Age group" required><input value={form.ageGroup} onChange={set('ageGroup')} placeholder="e.g. Toddlers (18 months-3 years)" required /></Field>
        <div className="form-row">
          <Field label="Capacity" required><input type="number" min={1} value={form.capacity} onChange={set('capacity')} required /></Field>
          <Field label="Monthly fee"><input type="number" min={0} value={form.monthlyFee} onChange={set('monthlyFee')} /></Field>
        </div>
        <Field label="Description"><textarea rows={2} value={form.description} onChange={set('description')} /></Field>
        <fieldset className="fieldset">
          <legend>Assigned staff</legend>
          <div className="checkbox-list">
            {staffList.length === 0 && <p className="muted small">No staff accounts yet.</p>}
            {staffList.map((s) => (
              <label key={s._id} className="checkbox">
                <input type="checkbox" checked={form.staff.includes(s._id)} onChange={() => toggle(s._id)} />
                <span>{s.name} <span className="muted small">{s.position}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function RosterModal({ room, onClose }) {
  const { data, loading } = useFetch(room ? `/classrooms/${room._id}` : null);
  return (
    <Modal open={Boolean(room)} onClose={onClose} title={room ? `${room.name} roster` : ''}>
      {loading ? <Spinner /> : (
        <ul className="list">
          {data?.children.length === 0 && <p className="muted">No children enrolled.</p>}
          {data?.children.map((c) => (
            <li key={c._id} className="list-item">
              <Link to={`/children/${c._id}`} className="row-link">
                <Avatar name={childName(c)} size={34} />
                <span>{childName(c)}</span>
              </Link>
              <span className="muted small">{calcAge(c.dateOfBirth)}{c.allergies.length ? ` · ⚠ ${c.allergies.join(', ')}` : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default function Classrooms() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const { data, loading, error, reload } = useFetch('/classrooms');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [roster, setRoster] = useState(null);

  const remove = async (room) => {
    if (!window.confirm(`Delete ${room.name}? Children in this room will become unassigned.`)) return;
    try {
      await api.delete(`/classrooms/${room._id}`);
      toast.success('Classroom deleted');
      reload(true);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const rooms = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Classrooms"
        subtitle="Groups, capacity, fees and staff assignments."
        actions={isAdmin && (
          <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <FiPlus /> New classroom
          </button>
        )}
      />
      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && rooms.length === 0 && <EmptyState icon={FiGrid} title="No classrooms yet" />}

      <div className="card-grid">
        {rooms.map((r) => {
          const pct = Math.min(100, Math.round((r.enrolled / r.capacity) * 100));
          return (
            <div key={r._id} className="card room-card">
              <div className="card-head">
                <div>
                  <h3>{r.name}</h3>
                  <p className="muted small">{r.ageGroup}{r.roomNumber ? ` · Room ${r.roomNumber}` : ''}</p>
                </div>
                {isAdmin && (
                  <div className="row-actions">
                    <button type="button" className="icon-btn" onClick={() => { setEditing(r); setFormOpen(true); }} aria-label="Edit"><FiEdit2 /></button>
                    <button type="button" className="icon-btn danger" onClick={() => remove(r)} aria-label="Delete"><FiTrash2 /></button>
                  </div>
                )}
              </div>
              {r.description && <p className="small">{r.description}</p>}
              <div className="occupancy">
                <div className="occupancy-row">
                  <span className="small">Occupancy</span>
                  <span className="muted small">{r.enrolled} / {r.capacity}</span>
                </div>
                <div className="progress"><div className={pct >= 90 ? 'progress-bar warn' : 'progress-bar'} style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="chip-row">
                {r.staff.length === 0 ? <Badge tone="gray">No staff assigned</Badge> : r.staff.map((s) => <Badge key={s._id} tone="blue">{s.name}</Badge>)}
              </div>
              <div className="card-foot">
                {isAdmin && <span className="small"><strong>{formatCurrency(r.monthlyFee)}</strong> / month</span>}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRoster(r)}><FiUsers /> View roster</button>
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && <ClassroomForm open={formOpen} onClose={() => setFormOpen(false)} room={editing} onSaved={() => reload(true)} />}
      <RosterModal room={roster} onClose={() => setRoster(null)} />
    </div>
  );
}
