const CURRENCY = import.meta.env.VITE_CURRENCY || 'LKR';

/** Parses dates; treats 'YYYY-MM-DD' as a local date (not UTC). */
export const parseDate = (d) =>
  typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d);

export const toDateStr = (d = new Date()) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const todayStr = () => toDateStr();
export const currentPeriod = () => todayStr().slice(0, 7);
export const toInputDate = (d) => (d ? toDateStr(parseDate(d)) : '');

export const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const formatCurrency = (n = 0) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${CURRENCY} ${Number(n).toLocaleString()}`;
  }
};

export const formatDate = (d, opts = {}) =>
  d ? parseDate(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...opts }) : '—';

export const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—';

export const formatDateTime = (d) => (d ? `${formatDate(d)}, ${formatTime(d)}` : '—');

/** "13:05" -> "1:05 PM" */
export const formatClock = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export const formatPeriod = (p) => {
  if (!p) return '—';
  const [y, m] = p.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

export const timeAgo = (d) => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(d);
};

export const getError = (err) => err?.response?.data?.message || err?.message || 'Something went wrong';

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

export const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

export const childName = (c) => (c ? `${c.firstName} ${c.lastName}` : 'Unknown');

export const calcAge = (dob) => {
  if (!dob) return '';
  const now = new Date();
  const b = new Date(dob);
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return y > 0 ? `${y}y ${m}m` : `${Math.max(m, 0)}m`;
};