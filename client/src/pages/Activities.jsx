import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiCoffee, FiMoon, FiStar, FiDroplet, FiSmile, FiThermometer, FiFileText, FiBookOpen } from 'react-icons/fi';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { PageHeader, Spinner, ErrorBox, EmptyState, Field, Badge } from '../components/ui.jsx';
import { childName, capitalize, formatClock, formatDate, getError, nowTime, todayStr } from '../utils/format.js';

export const ACTIVITY_META = {
  meal: { icon: FiCoffee, label: 'Meal', tone: 'amber' },
  nap: { icon: FiMoon, label: 'Nap', tone: 'blue' },
  activity: { icon: FiStar, label: 'Activity', tone: 'teal' },
  toilet: { icon: FiDroplet, label: 'Toilet / Diaper', tone: 'gray' },
  mood: { icon: FiSmile, label: 'Mood', tone: 'purple' },
  medication: { icon: FiThermometer, label: 'Medication', tone: 'red' },
  note: { icon: FiFileText, label: 'Note', tone: 'gray' },
};
const MOODS = ['happy', 'calm', 'excited', 'tired', 'fussy', 'sad'];

export function ActivityIcon({ type }) {
  const meta = ACTIVITY_META[type] || ACTIVITY_META.note;
  const Icon = meta.icon;
  return (
    <span className={`timeline-icon tone-${meta.tone}`}>
      <Icon />
    </span>
  );
}

function LogForm({ open, onClose, log, onSaved }) {
  const blank = { children: [], date: todayStr(), time: nowTime(), type: 'activity', title: '', details: '', mood: '', mealAmount: '', durationMins: '' };
  const [form, setForm] = useState(blank);
  const [kids, setKids] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(log ? { ...blank, ...log, children: [log.child?._id], mood: log.mood || '', mealAmount: log.mealAmount || '', durationMins: log.durationMins ?? '' } : { ...blank, time: nowTime() });
    if (!log) api.get('/children', { params: { status: 'active' } }).then((r) => setKids(r.data.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, log]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleKid = (id) =>
    setForm({ ...form, children: form.children.includes(id) ? form.children.filter((c) => c !== id) : [...form.children, id] });

  const submit = async (e) => {
    e.preventDefault();
    if (!log && form.children.length === 0) return toast.error('Select at least one child');
    setSaving(true);
    const payload = {
      date: form.date, time: form.time, type: form.type, title: form.title, details: form.details,
      mood: form.mood || undefined,
      mealAmount: form.type === 'meal' && form.mealAmount ? form.mealAmount : undefined,
      durationMins: form.type === 'nap' && form.durationMins !== '' ? Number(form.durationMins) : undefined,
    };
    try {
      if (log) await api.put(`/activities/${log._id}`, payload);
      else await api.post('/activities', { ...payload, children: form.children });
      toast.success(log ? 'Entry updated' : `Logged for ${form.children.length} child(ren)`);
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
      size="lg"
      title={log ? 'Edit entry' : 'Add daily report entry'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="log-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </>
      }
    >
      <form id="log-form" className="form" onSubmit={submit}>
        {!log && (
          <fieldset className="fieldset">
            <legend>Children ({form.children.length} selected)</legend>
            <div className="toolbar tight">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, children: kids.map((k) => k._id) })}>Select all</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, children: [] })}>Clear</button>
            </div>
            <div className="checkbox-list columns">
              {kids.map((k) => (
                <label key={k._id} className="checkbox">
                  <input type="checkbox" checked={form.children.includes(k._id)} onChange={() => toggleKid(k._id)} />
                  <span>{childName(k)} <span className="muted small">{k.classroom?.name}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="form-row three">
          <Field label="Type" required>
            <select value={form.type} onChange={set('type')}>
              {Object.entries(ACTIVITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Date" required><input type="date" max={todayStr()} value={form.date} onChange={set('date')} required /></Field>
          <Field label="Time" required><input type="time" value={form.time} onChange={set('time')} required /></Field>
        </div>
        <Field label="Title" required><input value={form.title} onChange={set('title')} placeholder="e.g. Lunch, Painting, Afternoon nap" required /></Field>
        <Field label="Details"><textarea rows={3} value={form.details} onChange={set('details')} /></Field>
        <div className="form-row three">
          <Field label="Mood">
            <select value={form.mood} onChange={set('mood')}>
              <option value="">—</option>
              {MOODS.map((m) => <option key={m} value={m}>{capitalize(m)}</option>)}
            </select>
          </Field>
          {form.type === 'meal' && (
            <Field label="Amount eaten">
              <select value={form.mealAmount} onChange={set('mealAmount')}>
                <option value="">—</option>
                {['all', 'most', 'some', 'none'].map((m) => <option key={m} value={m}>{capitalize(m)}</option>)}
              </select>
            </Field>
          )}
          {form.type === 'nap' && (
            <Field label="Duration (minutes)"><input type="number" min={0} value={form.durationMins} onChange={set('durationMins')} /></Field>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default function Activities() {
  const { user } = useAuth();
  const canEdit = user.role !== 'parent';
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({ date: todayStr(), child: '', type: '' });
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1' && canEdit);
  const [editing, setEditing] = useState(null);

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const { data, loading, error, reload } = useFetch('/activities', params);
  const { data: kids } = useFetch('/children', canEdit ? { status: 'active' } : undefined);
  const logs = data?.data || [];

  // Group entries by child for a readable daily report
  const grouped = useMemo(() => {
    const map = new Map();
    logs.forEach((l) => {
      const key = l.child?._id || 'unknown';
      if (!map.has(key)) map.set(key, { child: l.child, items: [] });
      map.get(key).items.push(l);
    });
    return [...map.values()].map((g) => ({ ...g, items: g.items.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) }));
  }, [logs]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    if (searchParams.get('new')) setSearchParams({});
  };

  const remove = async (log) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.delete(`/activities/${log._id}`);
      toast.success('Entry deleted');
      reload(true);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Daily Reports"
        subtitle={canEdit ? 'Record meals, naps, activities and moods throughout the day.' : "See what your child got up to today."}
        actions={canEdit && (
          <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <FiPlus /> Add entry
          </button>
        )}
      />
      <div className="toolbar">
        <input type="date" value={filters.date} max={todayStr()} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        <select value={filters.child} onChange={(e) => setFilters({ ...filters, child: e.target.value })}>
          <option value="">{user.role === 'parent' ? 'All my children' : 'All children'}</option>
          {kids?.data.map((k) => <option key={k._id} value={k._id}>{childName(k)}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All types</option>
          {Object.entries(ACTIVITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && grouped.length === 0 && (
        <EmptyState icon={FiBookOpen} title="No entries" message={`Nothing recorded for ${formatDate(filters.date)} yet.`} />
      )}

      <div className="report-grid">
        {grouped.map((g) => (
          <div key={g.child?._id} className="card">
            <div className="card-head">
              <h3>{childName(g.child)}</h3>
              <Badge tone="teal">{g.items.length} entries</Badge>
            </div>
            <ul className="timeline">
              {g.items.map((l) => (
                <li key={l._id}>
                  <ActivityIcon type={l.type} />
                  <div className="grow">
                    <div className="timeline-head">
                      <strong>{formatClock(l.time)} · {l.title}</strong>
                      {canEdit && (
                        <span className="row-actions">
                          <button type="button" className="icon-btn" onClick={() => { setEditing(l); setFormOpen(true); }} aria-label="Edit"><FiEdit2 /></button>
                          <button type="button" className="icon-btn danger" onClick={() => remove(l)} aria-label="Delete"><FiTrash2 /></button>
                        </span>
                      )}
                    </div>
                    {l.details && <p className="small">{l.details}</p>}
                    <p className="muted small">
                      {ACTIVITY_META[l.type]?.label}
                      {l.mood && ` · Mood: ${l.mood}`}
                      {l.mealAmount && ` · Ate ${l.mealAmount}`}
                      {l.durationMins ? ` · ${l.durationMins} min` : ''}
                      {` · ${l.recordedBy?.name || ''}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {canEdit && <LogForm open={formOpen} onClose={closeForm} log={editing} onSaved={() => reload(true)} />}
    </div>
  );
}