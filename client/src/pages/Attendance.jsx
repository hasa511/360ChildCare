import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLogIn, FiLogOut, FiXCircle, FiRotateCcw, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { PageHeader, Spinner, ErrorBox, EmptyState, Badge, Avatar, Field } from '../components/ui.jsx';
import { childName, formatDate, formatTime, getError, todayStr } from '../utils/format.js';

function StatusBadge({ record }) {
  if (!record) return <Badge tone="gray">Not marked</Badge>;
  if (record.status === 'absent') return <Badge tone="amber">Absent</Badge>;
  if (record.checkOutTime) return <Badge tone="blue">Checked out</Badge>;
  return <Badge tone="green">In centre</Badge>;
}

/** Modal used for check-in, check-out and absence. */
function ActionModal({ action, onClose, onDone }) {
  const [person, setPerson] = useState('');
  const [other, setOther] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  if (!action) return null;
  const { type, child } = action;
  const pickups = child.authorizedPickups || [];
  const titles = { in: `Check in ${child.firstName}`, out: `Check out ${child.firstName}`, absent: `Mark ${child.firstName} absent` };

  const submit = async (e) => {
    e.preventDefault();
    const who = person === '__other' ? other : person;
    setSaving(true);
    try {
      let res;
      if (type === 'in') res = await api.post('/attendance/check-in', { childId: child._id, droppedOffBy: who, notes: text });
      if (type === 'out') res = await api.post('/attendance/check-out', { childId: child._id, pickedUpBy: who, notes: text });
      if (type === 'absent') res = await api.post('/attendance/absent', { childId: child._id, reason: text });
      toast.success(res.data.message);
      if (res.data.warning) toast(res.data.warning, { icon: '⚠️', duration: 6000 });
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
      onClose={onClose}
      title={titles[type]}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="att-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Confirm'}</button>
        </>
      }
    >
      <form id="att-form" className="form" onSubmit={submit}>
        {type !== 'absent' && (
          <>
            <Field label={type === 'in' ? 'Dropped off by' : 'Picked up by'} required={type === 'out'}>
              <select value={person} onChange={(e) => setPerson(e.target.value)} required={type === 'out'}>
                <option value="">Select...</option>
                {pickups.map((p) => <option key={p.name} value={p.name}>{p.name} ({p.relationship || 'authorized'})</option>)}
                <option value="__other">Someone else...</option>
              </select>
            </Field>
            {person === '__other' && (
              <Field label="Name" required hint={type === 'out' ? 'Not on the authorized list - verify ID before release.' : undefined}>
                <input value={other} onChange={(e) => setOther(e.target.value)} required />
              </Field>
            )}
            {type === 'out' && person === '__other' && (
              <div className="alert alert-warn"><FiAlertCircle /> This person is not an authorized pickup.</div>
            )}
          </>
        )}
        <Field label={type === 'absent' ? 'Reason' : 'Notes'}>
          <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}

function StaffAttendance() {
  const [date, setDate] = useState(todayStr());
  const [classroom, setClassroom] = useState('');
  const [action, setAction] = useState(null);
  const { data, loading, error, reload } = useFetch('/attendance/daily', { date, classroom });
  const { data: rooms } = useFetch('/classrooms');
  const isToday = date === todayStr();
  const s = data?.summary;

  const undo = async (record) => {
    if (!window.confirm('Remove this attendance record?')) return;
    try {
      await api.delete(`/attendance/${record._id}`);
      toast.success('Record removed');
      reload(true);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Check children in and out, and record absences." />
      <div className="toolbar">
        <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
        <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
          <option value="">All classrooms</option>
          {rooms?.data.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
        {!isToday && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDate(todayStr())}>Today</button>}
      </div>

      {s && (
        <div className="summary-chips">
          <span className="chip">Total <strong>{s.total}</strong></span>
          <span className="chip chip-green">Present <strong>{s.present}</strong></span>
          <span className="chip chip-blue">Checked out <strong>{s.checkedOut}</strong></span>
          <span className="chip chip-amber">Absent <strong>{s.absent}</strong></span>
          <span className="chip">Not marked <strong>{s.notMarked}</strong></span>
        </div>
      )}
      {!isToday && <p className="muted small">Viewing a past date - check-in/out is only available for today.</p>}

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.data.length === 0 && <EmptyState title="No active children" />}

      {data && data.data.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr><th>Child</th><th>Classroom</th><th>Status</th><th>In</th><th>Out</th><th>Drop-off / Pickup</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {data.data.map(({ child, record }) => (
                <tr key={child._id}>
                  <td>
                    <Link to={`/children/${child._id}`} className="row-link">
                      <Avatar name={childName(child)} size={32} />
                      <span>
                        {childName(child)}
                        {child.allergies?.length > 0 && <FiAlertCircle className="text-red" title={`Allergies: ${child.allergies.join(', ')}`} />}
                      </span>
                    </Link>
                  </td>
                  <td>{child.classroom?.name || '—'}</td>
                  <td><StatusBadge record={record} />{record?.absenceReason && <div className="muted small">{record.absenceReason}</div>}</td>
                  <td>{formatTime(record?.checkInTime)}</td>
                  <td>{formatTime(record?.checkOutTime)}</td>
                  <td className="small">{[record?.droppedOffBy, record?.pickedUpBy].filter(Boolean).join(' / ') || '—'}</td>
                  <td>
                    <div className="row-actions end">
                      {isToday && (!record || record.status === 'absent') && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAction({ type: 'in', child })}><FiLogIn /> In</button>
                      )}
                      {isToday && record?.checkInTime && !record.checkOutTime && (
                        <button type="button" className="btn btn-accent btn-sm" onClick={() => setAction({ type: 'out', child })}><FiLogOut /> Out</button>
                      )}
                      {isToday && !record && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAction({ type: 'absent', child })}><FiXCircle /> Absent</button>
                      )}
                      {record && (
                        <button type="button" className="icon-btn" title="Undo / remove record" onClick={() => undo(record)}><FiRotateCcw /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {action && (
        <ActionModal
          key={`${action.type}-${action.child._id}`}
          action={action}
          onClose={() => setAction(null)}
          onDone={() => reload(true)}
        />
      )}
    </div>
  );
}

function ParentAttendance() {
  const { data: kids } = useFetch('/children');
  const { data, loading, error, reload } = useFetch('/attendance', { limit: 60 });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ childId: '', date: todayStr(), reason: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/attendance/absent', form);
      toast.success(res.data.message);
      setOpen(false);
      setForm({ childId: '', date: todayStr(), reason: '' });
      reload(true);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Your children's check-in history."
        actions={<button type="button" className="btn btn-primary" onClick={() => setOpen(true)}><FiCalendar /> Report an absence</button>}
      />
      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.data.length === 0 && <EmptyState title="No attendance records yet" />}
      {data && data.data.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <thead><tr><th>Date</th><th>Child</th><th>Status</th><th>Check-in</th><th>Check-out</th><th>Picked up by</th></tr></thead>
            <tbody>
              {data.data.map((r) => (
                <tr key={r._id}>
                  <td>{formatDate(r.date, { weekday: 'short' })}</td>
                  <td>{childName(r.child)}</td>
                  <td><StatusBadge record={r} />{r.absenceReason && <div className="muted small">{r.absenceReason}</div>}</td>
                  <td>{formatTime(r.checkInTime)}</td>
                  <td>{formatTime(r.checkOutTime)}</td>
                  <td>{r.pickedUpBy || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Report an absence"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="absence-form" className="btn btn-primary" disabled={saving}>Submit</button>
          </>
        }
      >
        <form id="absence-form" className="form" onSubmit={submit}>
          <Field label="Child" required>
            <select value={form.childId} onChange={(e) => setForm({ ...form, childId: e.target.value })} required>
              <option value="">Select...</option>
              {kids?.data.filter((c) => c.status === 'active').map((c) => <option key={c._id} value={c._id}>{childName(c)}</option>)}
            </select>
          </Field>
          <Field label="Date" required>
            <input type="date" min={todayStr()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Reason">
            <textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Doctor appointment" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

export default function Attendance() {
  const { user } = useAuth();
  return user.role === 'parent' ? <ParentAttendance /> : <StaffAttendance />;
}