import { initials } from '../utils/format.js';

export function Spinner({ full = false, label }) {
  return (
    <div className={full ? 'spinner-wrap full' : 'spinner-wrap'}>
      <div className="spinner" />
      {label && <p className="muted">{label}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, tone = 'teal', hint }) {
  return (
    <div className="stat-card">
      {Icon && (
        <div className={`stat-icon tone-${tone}`}>
          <Icon />
        </div>
      )}
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon className="empty-icon" />}
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}

export function Badge({ tone = 'gray', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Avatar({ name, size = 40, tone }) {
  const palette = ['#2a9d8f', '#e76f51', '#f4a261', '#457b9d', '#8e7dbe', '#e9a23b'];
  const idx = (name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0) % palette.length;
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: tone || palette[idx] }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

export function Field({ label, hint, children, required }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="req"> *</span>}
      </span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="error-box">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRetry()}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          className={active === t.key ? 'tab active' : 'tab'}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Tone helpers shared across pages */
export const severityTone = { low: 'green', medium: 'amber', high: 'red' };
export const invoiceTone = (inv) => (inv.status === 'paid' ? 'green' : inv.status === 'cancelled' ? 'gray' : inv.isOverdue ? 'red' : 'amber');
export const invoiceLabel = (inv) => (inv.status === 'unpaid' && inv.isOverdue ? 'Overdue' : inv.status);