import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiBell, FiCalendar, FiBookmark } from 'react-icons/fi';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { PageHeader, Spinner, ErrorBox, EmptyState, Field, Badge } from '../components/ui.jsx';
import { capitalize, formatDate, formatDateTime, getError, timeAgo } from '../utils/format.js';

const CATEGORIES = ['general', 'event', 'holiday', 'health', 'reminder'];
const categoryTone = { general: 'gray', event: 'teal', holiday: 'purple', health: 'red', reminder: 'amber' };

const toLocalInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function AnnouncementForm({ open, onClose, item, onSaved, role }) {
  const blank = { title: '', body: '', category: 'general', audience: 'all', eventDate: '', pinned: false };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(item ? { ...blank, ...item, eventDate: toLocalInput(item.eventDate) } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title, body: form.body, category: form.category, audience: form.audience, pinned: form.pinned,
      eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : null,
    };
    try {
      if (item) await api.put(`/announcements/${item._id}`, payload);
      else await api.post('/announcements', payload);
      toast.success(item ? 'Announcement updated' : 'Announcement published');
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
      title={item ? 'Edit announcement' : 'New announcement'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="ann-form" className="btn btn-primary" disabled={saving}>{item ? 'Save' : 'Publish'}</button>
        </>
      }
    >
      <form id="ann-form" className="form" onSubmit={submit}>
        <Field label="Title" required><input value={form.title} onChange={set('title')} required /></Field>
        <Field label="Message" required><textarea rows={5} value={form.body} onChange={set('body')} required /></Field>
        <div className="form-row three">
          <Field label="Category">
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
            </select>
          </Field>
          <Field label="Audience">
            <select value={form.audience} onChange={set('audience')}>
              <option value="all">Everyone</option>
              <option value="parents">Parents only</option>
              <option value="staff">Staff only</option>
            </select>
          </Field>
          <Field label="Event date (optional)"><input type="datetime-local" value={form.eventDate} onChange={set('eventDate')} /></Field>
        </div>
        {role === 'admin' && (
          <label className="checkbox">
            <input type="checkbox" checked={form.pinned} onChange={set('pinned')} />
            <span>Pin to top</span>
          </label>
        )}
      </form>
    </Modal>
  );
}

export default function Announcements() {
  const { user } = useAuth();
  const canPost = user.role !== 'parent';
  const [category, setCategory] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { data, loading, error, reload } = useFetch('/announcements', category ? { category } : undefined);
  const { data: upcoming, reload: reloadUpcoming } = useFetch('/announcements', { upcoming: true, limit: 6 });
  const items = data?.data || [];
  const refresh = () => {
    reload(true);
    reloadUpcoming(true);
  };

  const canModify = (a) => user.role === 'admin' || a.author?._id === user._id;

  const remove = async (a) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${a._id}`);
      toast.success('Deleted');
      refresh();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="News, events and reminders from the daycare."
        actions={canPost && (
          <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <FiPlus /> New announcement
          </button>
        )}
      />
      <div className="toolbar">
        <div className="pill-group">
          <button type="button" className={!category ? 'pill active' : 'pill'} onClick={() => setCategory('')}>All</button>
          {CATEGORIES.map((c) => (
            <button type="button" key={c} className={category === c ? 'pill active' : 'pill'} onClick={() => setCategory(c)}>{capitalize(c)}</button>
          ))}
        </div>
      </div>

      <div className="layout-aside">
        <div className="stack">
          {loading && <Spinner />}
          {error && <ErrorBox message={error} onRetry={reload} />}
          {!loading && items.length === 0 && <EmptyState icon={FiBell} title="No announcements" />}
          {items.map((a) => (
            <article key={a._id} className={a.pinned ? 'card announcement pinned' : 'card announcement'}>
              <div className="card-head">
                <div>
                  <h3>{a.pinned && <FiBookmark className="text-accent" />} {a.title}</h3>
                  <p className="muted small">
                    {a.author?.name} · {timeAgo(a.createdAt)}
                    {user.role === 'admin' && ` · For: ${a.audience === 'all' ? 'everyone' : a.audience}`}
                  </p>
                </div>
                <div className="chip-row">
                  <Badge tone={categoryTone[a.category]}>{capitalize(a.category)}</Badge>
                  {canModify(a) && (
                    <>
                      <button type="button" className="icon-btn" onClick={() => { setEditing(a); setFormOpen(true); }} aria-label="Edit"><FiEdit2 /></button>
                      <button type="button" className="icon-btn danger" onClick={() => remove(a)} aria-label="Delete"><FiTrash2 /></button>
                    </>
                  )}
                </div>
              </div>
              <p className="pre-line">{a.body}</p>
              {a.eventDate && <p className="event-line"><FiCalendar /> {formatDateTime(a.eventDate)}</p>}
            </article>
          ))}
        </div>
        <aside className="card">
          <h3><FiCalendar /> Upcoming</h3>
          {!upcoming?.data.length ? <p className="muted small">No upcoming events.</p> : (
            <ul className="list">
              {upcoming.data.map((e) => (
                <li key={e._id} className="list-item column">
                  <strong>{e.title}</strong>
                  <span className="muted small">{formatDate(e.eventDate, { weekday: 'short' })}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {canPost && <AnnouncementForm open={formOpen} onClose={() => setFormOpen(false)} item={editing} role={user.role} onSaved={refresh} />}
    </div>
  );
}