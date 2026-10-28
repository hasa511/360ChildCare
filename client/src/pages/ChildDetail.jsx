import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiEdit2, FiTrash2, FiAlertCircle, FiPhone } from 'react-icons/fi';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import ChildForm from '../components/ChildForm.jsx';
import {
  Spinner, ErrorBox, Avatar, Badge, Tabs, EmptyState, severityTone, invoiceTone, invoiceLabel,
} from '../components/ui.jsx';
import { ActivityIcon } from './Activities.jsx';
import {
  calcAge, childName, capitalize, formatDate, formatTime, formatClock, formatCurrency, formatPeriod, getError, todayStr,
} from '../utils/format.js';

function Info({ label, children }) {
  return (
    <div className="info">
      <span className="info-label">{label}</span>
      <span>{children || '—'}</span>
    </div>
  );
}

function ContactsCard({ title, items }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {!items?.length ? (
        <p className="muted">None recorded.</p>
      ) : (
        <ul className="list">
          {items.map((c) => (
            <li key={`${c.name}-${c.phone}`} className="list-item">
              <div>
                <strong>{c.name}</strong>
                <div className="muted small">{c.relationship}</div>
              </div>
              <a href={`tel:${c.phone}`} className="link"><FiPhone /> {c.phone}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AttendanceTab({ childId }) {
  const { data, loading } = useFetch('/attendance', { child: childId, limit: 30 });
  if (loading) return <Spinner />;
  const rows = data?.data || [];
  if (!rows.length) return <EmptyState title="No attendance records yet" />;
  return (
    <div className="table-wrap card">
      <table className="table">
        <thead>
          <tr><th>Date</th><th>Status</th><th>Check-in</th><th>Check-out</th><th>Picked up by</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id}>
              <td>{formatDate(r.date, { weekday: 'short' })}</td>
              <td><Badge tone={r.status === 'present' ? 'green' : 'amber'}>{r.status}</Badge>{r.absenceReason && <span className="muted small"> {r.absenceReason}</span>}</td>
              <td>{formatTime(r.checkInTime)}</td>
              <td>{formatTime(r.checkOutTime)}</td>
              <td>{r.pickedUpBy || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogsTab({ childId }) {
  const [date, setDate] = useState(todayStr());
  const { data, loading } = useFetch('/activities', { child: childId, date });
  const logs = data?.data || [];
  return (
    <div className="card">
      <div className="card-head">
        <h3>Daily report</h3>
        <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
      </div>
      {loading ? <Spinner /> : logs.length === 0 ? (
        <p className="muted">No entries for {formatDate(date)}.</p>
      ) : (
        <ul className="timeline">
          {[...logs].reverse().map((l) => (
            <li key={l._id}>
              <ActivityIcon type={l.type} />
              <div>
                <strong>{formatClock(l.time)} · {l.title}</strong>
                {l.details && <p className="small">{l.details}</p>}
                <p className="muted small">
                  {l.mood && `Mood: ${l.mood} · `}
                  {l.mealAmount && `Ate: ${l.mealAmount} · `}
                  {l.durationMins ? `${l.durationMins} min · ` : ''}
                  by {l.recordedBy?.name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IncidentsTab({ childId }) {
  const { data, loading } = useFetch('/incidents', { child: childId });
  if (loading) return <Spinner />;
  const rows = data?.data || [];
  if (!rows.length) return <EmptyState title="No incidents recorded" message="That's great news!" />;
  return (
    <div className="stack">
      {rows.map((i) => (
        <div key={i._id} className="card">
          <div className="card-head">
            <strong>{capitalize(i.type)} · {formatDate(i.date)}</strong>
            <Badge tone={severityTone[i.severity]}>{i.severity}</Badge>
          </div>
          <p>{i.description}</p>
          {i.actionTaken && <p className="muted small">Action taken: {i.actionTaken}</p>}
          <p className="muted small">{i.acknowledgedAt ? `Acknowledged by ${i.acknowledgedBy?.name} on ${formatDate(i.acknowledgedAt)}` : 'Awaiting parent acknowledgement'}</p>
        </div>
      ))}
    </div>
  );
}

function BillingTab({ childId }) {
  const { data, loading } = useFetch('/invoices', { child: childId });
  if (loading) return <Spinner />;
  const rows = data?.data || [];
  if (!rows.length) return <EmptyState title="No invoices yet" />;
  return (
    <div className="table-wrap card">
      <table className="table">
        <thead><tr><th>Invoice</th><th>Period</th><th>Total</th><th>Due</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i._id}>
              <td>{i.invoiceNumber}</td>
              <td>{formatPeriod(i.period)}</td>
              <td>{formatCurrency(i.total)}</td>
              <td>{formatDate(i.dueDate)}</td>
              <td><Badge tone={invoiceTone(i)}>{invoiceLabel(i)}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ChildDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const { data, loading, error, reload } = useFetch(`/children/${id}`);
  const child = data?.data;
  const isAdmin = user.role === 'admin';

  const remove = async () => {
    if (!window.confirm(`Delete ${childName(child)} and ALL related records? Consider setting the status to "withdrawn" instead.`)) return;
    try {
      await api.delete(`/children/${id}`);
      toast.success('Child deleted');
      navigate('/children');
    } catch (err) {
      toast.error(getError(err));
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'logs', label: 'Daily Reports' },
    { key: 'incidents', label: 'Incidents' },
    ...(user.role !== 'staff' ? [{ key: 'billing', label: 'Billing' }] : []),
  ];

  return (
    <div>
      <Link to="/children" className="back-link"><FiArrowLeft /> Back to children</Link>
      <div className="profile-header card">
        <Avatar name={childName(child)} size={84} />
        <div className="profile-header-main">
          <h1>{childName(child)}</h1>
          <p className="muted">
            {calcAge(child.dateOfBirth)} old · {capitalize(child.gender)} · {child.classroom?.name || 'No classroom'}
          </p>
          <div className="chip-row">
            <Badge tone={child.status === 'active' ? 'green' : 'gray'}>{child.status}</Badge>
            {child.allergies?.map((a) => <Badge key={a} tone="red"><FiAlertCircle /> {a}</Badge>)}
          </div>
        </div>
        {isAdmin && (
          <div className="page-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}><FiEdit2 /> Edit</button>
            <button type="button" className="btn btn-danger-ghost" onClick={remove}><FiTrash2 /> Delete</button>
          </div>
        )}
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3>Details</h3>
            <div className="info-grid">
              <Info label="Date of birth">{formatDate(child.dateOfBirth)}</Info>
              <Info label="Enrolled">{formatDate(child.enrollmentDate)}</Info>
              <Info label="Blood group">{child.bloodGroup}</Info>
              <Info label="Classroom">{child.classroom ? `${child.classroom.name} (${child.classroom.ageGroup})` : ''}</Info>
              <Info label="Allergies">{child.allergies?.join(', ')}</Info>
              <Info label="Medical notes">{child.medicalNotes}</Info>
              <Info label="Other notes">{child.notes}</Info>
            </div>
            <h3 className="mt">Parents / guardians</h3>
            {child.parents.length === 0 ? <p className="muted">No parent linked.</p> : (
              <ul className="list">
                {child.parents.map((p) => (
                  <li key={p._id} className="list-item">
                    <div><strong>{p.name}</strong><div className="muted small">{p.email}</div></div>
                    <span className="small">{p.phone}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="stack">
            <ContactsCard title="Emergency contacts" items={child.emergencyContacts} />
            <ContactsCard title="Authorized pickups" items={child.authorizedPickups} />
          </div>
        </div>
      )}
      {tab === 'attendance' && <AttendanceTab childId={id} />}
      {tab === 'logs' && <LogsTab childId={id} />}
      {tab === 'incidents' && <IncidentsTab childId={id} />}
      {tab === 'billing' && <BillingTab childId={id} />}

      {isAdmin && <ChildForm open={editing} onClose={() => setEditing(false)} child={child} onSaved={() => reload(true)} />}
    </div>
  );
}