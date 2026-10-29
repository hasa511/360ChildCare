import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  FiSmile, FiCheckCircle, FiUsers, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiLogOut,
  FiClock, FiBookOpen, FiMessageSquare, FiCreditCard, FiPlus, FiCheckSquare,
} from 'react-icons/fi';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, ErrorBox, StatCard, PageHeader, Badge, Avatar, EmptyState, severityTone } from '../components/ui.jsx';
import { ActivityIcon } from './Activities.jsx';
import {
  formatCurrency, formatDate, formatTime, formatClock, childName, capitalize, parseDate, calcAge,
} from '../utils/format.js';

function AttendanceChart({ data }) {
  const rows = data.map((d) => ({ ...d, day: parseDate(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }) }));
  return (
    <div className="card">
      <div className="card-head">
        <h3>Attendance - last 7 days</h3>
      </div>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece7dc" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(42,157,143,0.08)' }} />
            <Bar dataKey="present" name="Present" fill="#2a9d8f" radius={[6, 6, 0, 0]} maxBarSize={38} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AnnouncementsCard({ items }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Announcements</h3>
        <Link to="/announcements" className="link">View all</Link>
      </div>
      {items.length === 0 ? (
        <p className="muted">No announcements yet.</p>
      ) : (
        <ul className="list">
          {items.map((a) => (
            <li key={a._id} className="list-item">
              <div>
                <strong>{a.title}</strong>
                <p className="muted small clamp-2">{a.body}</p>
              </div>
              <Badge tone="blue">{capitalize(a.category)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminDashboard({ d }) {
  const s = d.stats;
  return (
    <>
      <div className="stat-grid">
        <StatCard icon={FiSmile} label="Enrolled children" value={s.children} hint={`${s.classrooms} classrooms`} />
        <StatCard icon={FiCheckCircle} tone="green" label="Present today" value={s.presentToday} hint={`${s.absentToday} absent · ${s.checkedOutToday} gone home`} />
        <StatCard icon={FiUsers} tone="blue" label="Active staff" value={s.staff} hint={`${s.parents} parent accounts`} />
        <StatCard icon={FiDollarSign} tone="amber" label="Outstanding fees" value={formatCurrency(s.outstanding)} hint={`${s.unpaidCount} unpaid · ${s.overdueInvoices} overdue`} />
        <StatCard icon={FiTrendingUp} tone="green" label="Collected this month" value={formatCurrency(s.collectedThisMonth)} />
        <StatCard icon={FiAlertTriangle} tone="red" label="Incidents (7 days)" value={s.incidentsThisWeek} />
      </div>

      <div className="grid-2">
        <AttendanceChart data={d.attendanceTrend} />
        <div className="card">
          <div className="card-head">
            <h3>Classroom occupancy</h3>
            <Link to="/classrooms" className="link">Manage</Link>
          </div>
          {d.occupancy.length === 0 && <p className="muted">No classrooms yet.</p>}
          {d.occupancy.map((c) => {
            const pct = Math.min(100, Math.round((c.enrolled / c.capacity) * 100));
            return (
              <div key={c.name} className="occupancy">
                <div className="occupancy-row">
                  <strong>{c.name}</strong>
                  <span className="muted small">{c.enrolled} / {c.capacity}</span>
                </div>
                <div className="progress">
                  <div className={pct >= 90 ? 'progress-bar warn' : 'progress-bar'} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Recent incidents</h3>
            <Link to="/incidents" className="link">View all</Link>
          </div>
          {d.recentIncidents.length === 0 ? (
            <p className="muted">No incidents reported. 🎉</p>
          ) : (
            <ul className="list">
              {d.recentIncidents.map((i) => (
                <li key={i._id} className="list-item">
                  <div>
                    <strong>{childName(i.child)}</strong> · {capitalize(i.type)}
                    <p className="muted small clamp-2">{i.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={severityTone[i.severity]}>{i.severity}</Badge>
                    <div className="muted small">{formatDate(i.date)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <AnnouncementsCard items={d.announcements} />
      </div>
    </>
  );
}

function StaffDashboard({ d }) {
  const s = d.stats;
  return (
    <>
      <div className="quick-actions">
        <Link to="/attendance" className="quick-action"><FiCheckSquare /> Take attendance</Link>
        <Link to="/activities?new=1" className="quick-action"><FiPlus /> Add daily log</Link>
        <Link to="/incidents?new=1" className="quick-action"><FiAlertTriangle /> Report incident</Link>
        <Link to="/messages" className="quick-action"><FiMessageSquare /> Message parents</Link>
      </div>
      <div className="stat-grid">
        <StatCard icon={FiSmile} label={d.classrooms.length ? 'Children in my rooms' : 'Active children'} value={s.children} hint={d.classrooms.map((c) => c.name).join(', ') || 'Not assigned to a room'} />
        <StatCard icon={FiCheckCircle} tone="green" label="In the centre now" value={s.presentToday} />
        <StatCard icon={FiLogOut} tone="blue" label="Gone home" value={s.checkedOutToday} />
        <StatCard icon={FiClock} tone="amber" label="Not yet marked" value={s.notMarked} hint={`${s.absentToday} absent`} />
        <StatCard icon={FiBookOpen} tone="purple" label="My logs today" value={s.myLogsToday} />
        <StatCard icon={FiAlertTriangle} tone="red" label="Incidents (7 days)" value={s.incidentsThisWeek} />
      </div>
      <div className="grid-2">
        <AttendanceChart data={d.attendanceTrend} />
        <div className="card">
          <div className="card-head">
            <h3>Allergy alerts</h3>
          </div>
          {d.allergyAlerts.length === 0 ? (
            <p className="muted">No allergies recorded for your children.</p>
          ) : (
            <ul className="list">
              {d.allergyAlerts.map((c) => (
                <li key={c._id} className="list-item">
                  <Link to={`/children/${c._id}`}><strong>{childName(c)}</strong></Link>
                  <div className="chip-row">
                    {c.allergies.map((a) => <Badge key={a} tone="red">{a}</Badge>)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <AnnouncementsCard items={d.announcements} />
    </>
  );
}

function TodayStatus({ record }) {
  if (!record) return <Badge tone="gray">Not checked in yet</Badge>;
  if (record.status === 'absent') return <Badge tone="amber">Absent{record.absenceReason ? ` · ${record.absenceReason}` : ''}</Badge>;
  if (record.checkOutTime) return <Badge tone="blue">Picked up at {formatTime(record.checkOutTime)}</Badge>;
  return <Badge tone="green">At daycare since {formatTime(record.checkInTime)}</Badge>;
}

function ParentDashboard({ d }) {
  const s = d.stats;
  if (d.children.length === 0) {
    return (
      <EmptyState
        icon={FiSmile}
        title="No children linked yet"
        message="Once the daycare enrolls your child and links them to your account, you'll see their day here."
        action={<Link to="/messages" className="btn btn-primary">Message the daycare</Link>}
      />
    );
  }
  return (
    <>
      <div className="child-today-grid">
        {d.children.map(({ child, today }) => (
          <Link to={`/children/${child._id}`} key={child._id} className="card child-today">
            <Avatar name={childName(child)} size={56} />
            <div>
              <h3>{child.firstName}</h3>
              <p className="muted small">{child.classroom?.name || 'No classroom'} · {calcAge(child.dateOfBirth)}</p>
              <TodayStatus record={today} />
            </div>
          </Link>
        ))}
      </div>

      <div className="stat-grid">
        <StatCard icon={FiCreditCard} tone="amber" label="Amount due" value={formatCurrency(s.outstanding)} />
        <StatCard icon={FiMessageSquare} tone="blue" label="Unread messages" value={s.unreadMessages} />
        <StatCard icon={FiAlertTriangle} tone="red" label="Reports to acknowledge" value={s.pendingIncidents} />
      </div>

      {d.pendingIncidents.length > 0 && (
        <div className="alert alert-warn">
          <FiAlertTriangle />
          <div>
            <strong>Please review {d.pendingIncidents.length} incident report(s).</strong>{' '}
            <Link to="/incidents" className="link">Review now</Link>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Latest from the classroom</h3>
            <Link to="/activities" className="link">Daily reports</Link>
          </div>
          {d.recentLogs.length === 0 ? (
            <p className="muted">No updates yet today.</p>
          ) : (
            <ul className="timeline">
              {d.recentLogs.map((l) => (
                <li key={l._id}>
                  <ActivityIcon type={l.type} />
                  <div>
                    <strong>{l.child?.firstName}: {l.title}</strong>
                    <p className="muted small">{formatDate(l.date)} · {formatClock(l.time)}{l.details ? ` — ${l.details}` : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="stack">
          <div className="card">
            <div className="card-head">
              <h3>Unpaid invoices</h3>
              <Link to="/billing" className="link">Billing</Link>
            </div>
            {d.unpaidInvoices.length === 0 ? (
              <p className="muted">You're all paid up. Thank you!</p>
            ) : (
              <ul className="list">
                {d.unpaidInvoices.map((i) => (
                  <li key={i._id} className="list-item">
                    <div>
                      <strong>{i.child?.firstName}</strong> · {i.invoiceNumber}
                      <p className="muted small">Due {formatDate(i.dueDate)}</p>
                    </div>
                    <strong>{formatCurrency(i.total)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <AnnouncementsCard items={d.announcements} />
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/dashboard');

  const subtitle = {
    admin: "Here's what's happening across the centre today.",
    staff: "Here's your classroom at a glance.",
    parent: "Here's how your little ones are doing today.",
  }[user.role];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={subtitle} />
      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && user.role === 'admin' && <AdminDashboard d={data.data} />}
      {data && user.role === 'staff' && <StaffDashboard d={data.data} />}
      {data && user.role === 'parent' && <ParentDashboard d={data.data} />}
    </div>
  );
}