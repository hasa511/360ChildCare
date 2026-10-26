import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { Field } from '../components/ui.jsx';
import { getError } from '../utils/format.js';

const DEMO = [
  { role: 'Admin', email: 'admin@childcare360.com', password: 'admin123' },
  { role: 'Staff', email: 'kumudu@childcare360.com', password: 'staff123' },
  { role: 'Parent', email: 'parent@childcare360.com', password: 'parent123' },
];

export function AuthBrand() {
  return (
    <div className="auth-brand">
      <div className="brand big">
        <span className="brand-mark">360</span>
        <span>
          <strong>ChildCare</strong>
          <small>Smart Daycare Management</small>
        </span>
      </div>
      <h2>Every child's day, all in one place.</h2>
      <ul className="auth-points">
        <li><FiCheckCircle /> Secure check-in &amp; check-out with authorized pickups</li>
        <li><FiCheckCircle /> Daily reports on meals, naps, moods and activities</li>
        <li><FiCheckCircle /> Incident reports, billing and announcements</li>
        <li><FiCheckCircle /> Direct messaging between parents and caregivers</li>
      </ul>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthBrand />
      <div className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <h1>Sign in</h1>
          <p className="muted">Welcome back! Please enter your details.</p>
          <Field label="Email" required>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label="Password" required>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </Field>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="auth-switch">
            New parent? <Link to="/register">Create an account</Link>
          </p>

          <div className="demo-box">
            <span className="muted small">Demo accounts (after running the seed script):</span>
            <div className="demo-buttons">
              {DEMO.map((d) => (
                <button
                  type="button"
                  key={d.role}
                  className="btn btn-ghost btn-sm"
                  onClick={() => setForm({ email: d.email, password: d.password })}
                >
                  {d.role}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}