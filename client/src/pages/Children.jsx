import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiSmile, FiAlertCircle } from 'react-icons/fi';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import ChildForm from '../components/ChildForm.jsx';
import { PageHeader, Spinner, ErrorBox, EmptyState, Avatar, Badge } from '../components/ui.jsx';
import { calcAge, childName, capitalize } from '../utils/format.js';

const statusTone = { active: 'green', inactive: 'gray', withdrawn: 'red' };

export default function Children() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [filters, setFilters] = useState({ search: '', classroom: '', status: user.role === 'parent' ? '' : 'active' });
  const [formOpen, setFormOpen] = useState(false);

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const { data, loading, error, reload } = useFetch('/children', params);
  const { data: rooms } = useFetch(user.role === 'parent' ? null : '/classrooms');
  const children = data?.data || [];

  return (
    <div>
      <PageHeader
        title={user.role === 'parent' ? 'My Children' : 'Children'}
        subtitle={user.role === 'parent' ? 'Profiles, health information and pickup contacts.' : `${data?.count ?? 0} children found`}
        actions={
          isAdmin && (
            <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
              <FiPlus /> Enroll child
            </button>
          )
        }
      />

      {user.role !== 'parent' && (
        <div className="toolbar">
          <div className="search-input">
            <FiSearch />
            <input
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select value={filters.classroom} onChange={(e) => setFilters({ ...filters, classroom: e.target.value })}>
            <option value="">All classrooms</option>
            {rooms?.data.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      )}

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && !error && children.length === 0 && (
        <EmptyState
          icon={FiSmile}
          title="No children found"
          message={user.role === 'parent' ? 'Your child has not been linked to your account yet. Please contact the daycare.' : 'Try changing the filters or enroll a new child.'}
        />
      )}

      <div className="card-grid">
        {children.map((c) => (
          <Link key={c._id} to={`/children/${c._id}`} className="card child-card">
            <div className="child-card-top">
              <Avatar name={childName(c)} size={52} />
              <div>
                <h3>{childName(c)}</h3>
                <p className="muted small">{calcAge(c.dateOfBirth)} · {capitalize(c.gender)}</p>
              </div>
            </div>
            <div className="child-card-meta">
              <span>{c.classroom?.name || 'No classroom'}</span>
              <Badge tone={statusTone[c.status]}>{c.status}</Badge>
            </div>
            {c.allergies?.length > 0 && (
              <div className="allergy-line">
                <FiAlertCircle /> {c.allergies.join(', ')}
              </div>
            )}
            {user.role !== 'parent' && (
              <p className="muted small">Parents: {c.parents.map((p) => p.name).join(', ') || '—'}</p>
            )}
          </Link>
        ))}
      </div>

      {isAdmin && <ChildForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => reload(true)} />}
    </div>
  );
}