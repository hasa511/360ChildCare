import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../api/client.js';
import Modal from './Modal.jsx';
import { Field } from './ui.jsx';
import { getError, toInputDate } from '../utils/format.js';

const emptyContact = { name: '', relationship: '', phone: '' };

const toForm = (child) => ({
  firstName: child?.firstName || '',
  lastName: child?.lastName || '',
  dateOfBirth: toInputDate(child?.dateOfBirth),
  gender: child?.gender || '',
  classroom: child?.classroom?._id || child?.classroom || '',
  status: child?.status || 'active',
  parents: (child?.parents || []).map((p) => p._id || p),
  allergies: (child?.allergies || []).join(', '),
  bloodGroup: child?.bloodGroup || '',
  medicalNotes: child?.medicalNotes || '',
  emergencyContacts: child?.emergencyContacts?.length ? child.emergencyContacts : [{ ...emptyContact }],
  authorizedPickups: child?.authorizedPickups?.length ? child.authorizedPickups : [{ ...emptyContact }],
  enrollmentDate: toInputDate(child?.enrollmentDate || new Date()),
  notes: child?.notes || '',
});

function ContactList({ title, items, onChange }) {
  const update = (i, key, value) => onChange(items.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)));
  return (
    <fieldset className="fieldset">
      <legend>{title}</legend>
      {items.map((c, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div className="contact-row" key={i}>
          <input placeholder="Name" value={c.name} onChange={(e) => update(i, 'name', e.target.value)} />
          <input placeholder="Relationship" value={c.relationship || ''} onChange={(e) => update(i, 'relationship', e.target.value)} />
          <input placeholder="Phone" value={c.phone} onChange={(e) => update(i, 'phone', e.target.value)} />
          <button type="button" className="icon-btn danger" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="Remove">
            <FiTrash2 />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...items, { ...emptyContact }])}>
        <FiPlus /> Add
      </button>
    </fieldset>
  );
}

export default function ChildForm({ open, onClose, child, onSaved }) {
  const [form, setForm] = useState(toForm(child));
  const [classrooms, setClassrooms] = useState([]);
  const [parents, setParents] = useState([]);
  const [parentSearch, setParentSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(toForm(child));
    setParentSearch('');
    api.get('/classrooms').then((r) => setClassrooms(r.data.data)).catch(() => {});
    api.get('/users', { params: { role: 'parent' } }).then((r) => setParents(r.data.data)).catch(() => {});
  }, [open, child]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleParent = (id) =>
    setForm({ ...form, parents: form.parents.includes(id) ? form.parents.filter((p) => p !== id) : [...form.parents, id] });

  const visibleParents = useMemo(() => {
    const q = parentSearch.toLowerCase();
    return parents.filter((p) => !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [parents, parentSearch]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const cleanContacts = (list) => list.filter((c) => c.name.trim() && c.phone.trim());
    const payload = {
      ...form,
      emergencyContacts: cleanContacts(form.emergencyContacts),
      authorizedPickups: cleanContacts(form.authorizedPickups),
    };
    try {
      const res = child?._id ? await api.put(`/children/${child._id}`, payload) : await api.post('/children', payload);
      toast.success(child?._id ? 'Child profile updated' : 'Child enrolled successfully');
      onSaved?.(res.data.data);
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
      size="lg"
      title={child?._id ? 'Edit child profile' : 'Enroll a child'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="child-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <form id="child-form" onSubmit={submit} className="form">
        <div className="form-row">
          <Field label="First name" required><input value={form.firstName} onChange={set('firstName')} required /></Field>
          <Field label="Last name" required><input value={form.lastName} onChange={set('lastName')} required /></Field>
        </div>
        <div className="form-row three">
          <Field label="Date of birth" required>
            <input type="date" value={form.dateOfBirth} max={toInputDate(new Date())} onChange={set('dateOfBirth')} required />
          </Field>
          <Field label="Gender" required>
            <select value={form.gender} onChange={set('gender')} required>
              <option value="">Select...</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Blood group"><input value={form.bloodGroup} onChange={set('bloodGroup')} placeholder="e.g. O+" /></Field>
        </div>
        <div className="form-row three">
          <Field label="Classroom">
            <select value={form.classroom} onChange={set('classroom')}>
              <option value="">Unassigned</option>
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.enrolled}/{c.capacity})</option>
              ))}
            </select>
          </Field>
          <Field label="Enrollment date"><input type="date" value={form.enrollmentDate} onChange={set('enrollmentDate')} /></Field>
          <Field label="Status">
            <select value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </Field>
        </div>

        <fieldset className="fieldset">
          <legend>Linked parent accounts</legend>
          <input placeholder="Search parents..." value={parentSearch} onChange={(e) => setParentSearch(e.target.value)} />
          <div className="checkbox-list">
            {visibleParents.length === 0 && <p className="muted small">No parent accounts found. Create one in Users first.</p>}
            {visibleParents.map((p) => (
              <label key={p._id} className="checkbox">
                <input type="checkbox" checked={form.parents.includes(p._id)} onChange={() => toggleParent(p._id)} />
                <span>{p.name} <span className="muted small">({p.email})</span></span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Allergies" hint="Separate with commas, e.g. Peanuts, Dairy">
          <input value={form.allergies} onChange={set('allergies')} />
        </Field>
        <Field label="Medical notes"><textarea rows={2} value={form.medicalNotes} onChange={set('medicalNotes')} /></Field>

        <ContactList title="Emergency contacts" items={form.emergencyContacts} onChange={(v) => setForm({ ...form, emergencyContacts: v })} />
        <ContactList title="Authorized pickups" items={form.authorizedPickups} onChange={(v) => setForm({ ...form, authorizedPickups: v })} />

        <Field label="Other notes"><textarea rows={2} value={form.notes} onChange={set('notes')} /></Field>
      </form>
    </Modal>
  );
}