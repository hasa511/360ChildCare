import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { Field } from '../components/ui.jsx';
import { getError } from '../utils/format.js';
import { AuthBrand } from './Login.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setSubmitting(true);
    try {
      const { confirm, ...payload } = form;
      await register(payload);
      toast.success('Account created! The daycare will link your child to your account.');
      navigate('/', { replace: true });
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
          <h1>Parent registration</h1>
          <p className="muted">Create your account to follow your child's day.</p>
          <Field label="Full name" required>
            <input value={form.name} onChange={set('name')} required />
          </Field>
          <Field label="Email" required>
            <input type="email" value={form.email} onChange={set('email')} required />
          </Field>
          <div className="form-row">
            <Field label="Phone">
              <input value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Address">
              <input value={form.address} onChange={set('address')} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Password" required hint="At least 6 characters">
              <input type="password" minLength={6} value={form.password} onChange={set('password')} required />
            </Field>
            <Field label="Confirm password" required>
              <input type="password" value={form.confirm} onChange={set('confirm')} required />
            </Field>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
          <p className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}