import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiShield } from 'react-icons/fi';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { PageHeader, Spinner, ErrorBox, EmptyState, Field, Badge, severityTone } from '../components/ui.jsx';
import { childName, capitalize, formatDateTime, getError } from '../utils/format.js';

const toLocalInput = (d) => {
  const date = d ? new Date(d) : new Date();
  const off = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - off).toISOString().slice(0, 16);
};

function IncidentForm({ open, onClose, incident, onSaved }) {
  const blank = { child: '', date: toLocalInput(), type: 'injury', severity: 'low', location: '', description: '', actionTaken: '', parentNotified: false };
  const [form, setForm] = useState(blank);
  const [kids, setKids] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(incident ? { ...blank, ...incident, child: incident.child?._id, date: toLocalInput(incident.date) } : { ...blank, date: toLocalInput() });
    api.get('/children', { params: { status: 'active' } }).then((r) => setKids(r.data.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, incident]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      child: form.child, date: new Date(form.date).toISOString(), type: form.type, severity: form.severity,
      location: form.location, description: form.description, actionTaken: form.actionTaken, parentNotified: form.parentNotified,
    };
    try {
      if (incident) await api.put(`/incidents/${incident._id}`, payload);
      else await api.post('/incidents', payload);
      toast.success(incident ? 'Report updated' : 'Incident reported');
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
      title={incident ? 'Edit incident report' : 'Report an incident'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="incident-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </>
      }
    >
      <form id="incident-form" className="form" onSubmit={submit}>
        <div className="form-row">
          <Field label="Child" required>
            <select value={form.child} onChange={set('child')} required disabled={Boolean(incident)}>
              <option value="">Select...</option>
              {kids.map((k) => <option key={k._id} value={k._id}>{childName(k)}</option>)}
            </select>
          </Field>
          <Field label="Date & time" required><input type="datetime-local" value={form.date} onChange={set('date')} required /></Field>
        </div>
        <div className="form-row three">
          <Field label="Type">
            <select value={form.type} onChange={set('type')}>
              {['injury', 'illness', 'behavior', 'other'].map((t) => <option key={t} value={t}>{capitalize(t)}</option>)}
            </select>
          </Field>
          <Field label="Severity">
            <select value={form.severity} onChange={set('severity')}>
              {['low', 'medium', 'high'].map((t) => <option key={t} value={t}>{capitalize(t)}</option>)}
            </select>
          </Field>
          <Field label="Location"><input value={form.location} onChange={set('location')} placeholder="e.g. Playground" /></Field>
        </div>
        <Field label="What happened?" required><textarea rows={3} value={form.description} onChange={set('description')} required /></Field>
        <Field label="Action taken"><textarea rows={2} value={form.actionTaken} onChange={set('actionTaken')} /></Field>
        <label className="checkbox">
          <input type="checkbox" checked={form.parentNotified} onChange={set('parentNotified')} />
          <span>Parent has been notified (phone / in person)</span>
        </label>
      </form>
    </Modal>
  );
}

function AcknowledgeModal({ incident, onClose, onDone }) {
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await api.put(`/incidents/${incident._id}/acknowledge`, { comment });
      toast.success('Thank you - report acknowledged');
      onDone();
      onClose();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="Acknowledge report"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>Acknowledge</button>
        </>
      }
    >
      <p className="small">By acknowledging, you confirm you have read the report about <strong>{incident.child?.firstName}</strong>.</p>
      <Field label="Comment (optional)"><textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
    </Modal>
  );
}

export default function Incidents() {
  const { user } = useAuth();
  const isParent = user.role === 'parent';
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({ status: '', severity: '' });
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1' && !isParent);
  const [editing, setEditing] = useState(null);
  const [acking, setAcking] = useState(null);

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const { data, loading, error, reload } = useFetch('/incidents', params);
  const items = data?.data || [];

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    if (searchParams.get('new')) setSearchParams({});
  };

  const remove = async (i) => {
    if (!window.confirm('Delete this incident report?')) return;
    try {
      await api.delete(`/incidents/${i._id}`);
      toast.success('Report deleted');
      reload(true);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Incident Reports"
        subtitle={isParent ? 'Reports about your children. Please acknowledge each one.' : 'Record and track injuries, illnesses and behaviour incidents.'}
        actions={!isParent && (
          <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <FiPlus /> Report incident
          </button>
        )}
      />
      <div className="toolbar">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All reports</option>
          <option value="pending">Awaiting acknowledgement</option>
          <option value="acknowledged">Acknowledged</option>
        </select>
        <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
          <option value="">Any severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && items.length === 0 && <EmptyState icon={FiShield} title="No incident reports" message="Nothing to show for these filters." />}

      <div className="stack">
        {items.map((i) => (
          <div key={i._id} className={`card incident-card sev-${i.severity}`}>
            <div className="card-head">
              <div>
                <h3>{childName(i.child)} · {capitalize(i.type)}</h3>
                <p className="muted small">{formatDateTime(i.date)}{i.location ? ` · ${i.location}` : ''} · Reported by {i.reportedBy?.name}</p>
              </div>
              <div className="chip-row">
                <Badge tone={severityTone[i.severity]}>{i.severity}</Badge>
                {i.acknowledgedAt ? <Badge tone="green">Acknowledged</Badge> : <Badge tone="amber">Pending</Badge>}
              </div>
            </div>
            <p>{i.description}</p>
            {i.actionTaken && <p className="small"><strong>Action taken:</strong> {i.actionTaken}</p>}
            {i.acknowledgedAt && (
              <p className="muted small">
                Acknowledged by {i.acknowledgedBy?.name} on {formatDateTime(i.acknowledgedAt)}
                {i.parentComment && ` — "${i.parentComment}"`}
              </p>
            )}
            <div className="card-foot">
              <span className="muted small">{i.parentNotified ? 'Parent notified in person / by phone' : ''}</span>
              <div className="row-actions">
                {isParent && !i.acknowledgedAt && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setAcking(i)}><FiCheck /> Acknowledge</button>
                )}
                {!isParent && (
                  <button type="button" className="icon-btn" onClick={() => { setEditing(i); setFormOpen(true); }} aria-label="Edit"><FiEdit2 /></button>
                )}
                {user.role === 'admin' && (
                  <button type="button" className="icon-btn danger" onClick={() => remove(i)} aria-label="Delete"><FiTrash2 /></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isParent && <IncidentForm open={formOpen} onClose={closeForm} incident={editing} onSaved={() => reload(true)} />}
      {acking && <AcknowledgeModal incident={acking} onClose={() => setAcking(null)} onDone={() => reload(true)} />}
    </div>
  );
}