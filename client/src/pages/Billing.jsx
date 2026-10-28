import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiZap, FiEye, FiDollarSign, FiXCircle, FiTrash2, FiPrinter, FiCreditCard, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import {
  PageHeader, Spinner, ErrorBox, EmptyState, Field, Badge, StatCard, invoiceTone, invoiceLabel,
} from '../components/ui.jsx';
import {
  childName, capitalize, currentPeriod, formatCurrency, formatDate, formatPeriod, getError,
} from '../utils/format.js';

function InvoiceForm({ open, onClose, onSaved }) {
  const blank = { child: '', period: currentPeriod(), dueDate: '', discount: 0, notes: '', items: [{ description: '', amount: '' }] };
  const [form, setForm] = useState(blank);
  const [kids, setKids] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(blank);
    api.get('/children', { params: { status: 'active' } }).then((r) => setKids(r.data.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setItem = (i, k, v) => setForm({ ...form, items: form.items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)) });
  const subtotal = form.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/invoices', {
        ...form,
        discount: Number(form.discount) || 0,
        items: form.items.filter((i) => i.description && i.amount !== '').map((i) => ({ ...i, amount: Number(i.amount) })),
      });
      toast.success('Invoice created');
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
      title="New invoice"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="invoice-form" className="btn btn-primary" disabled={saving}>Create invoice</button>
        </>
      }
    >
      <form id="invoice-form" className="form" onSubmit={submit}>
        <Field label="Child" required>
          <select value={form.child} onChange={set('child')} required>
            <option value="">Select...</option>
            {kids.map((k) => <option key={k._id} value={k._id}>{childName(k)}</option>)}
          </select>
        </Field>
        <div className="form-row">
          <Field label="Billing period" required><input type="month" value={form.period} onChange={set('period')} required /></Field>
          <Field label="Due date" required><input type="date" value={form.dueDate} onChange={set('dueDate')} required /></Field>
        </div>
        <fieldset className="fieldset">
          <legend>Line items</legend>
          {form.items.map((it, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="item-row">
              <input placeholder="Description" value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} />
              <input type="number" min={0} placeholder="Amount" value={it.amount} onChange={(e) => setItem(i, 'amount', e.target.value)} />
              <button type="button" className="icon-btn danger" onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })} aria-label="Remove"><FiTrash2 /></button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, items: [...form.items, { description: '', amount: '' }] })}><FiPlus /> Add item</button>
        </fieldset>
        <div className="form-row">
          <Field label="Discount"><input type="number" min={0} value={form.discount} onChange={set('discount')} /></Field>
          <div className="total-box">
            <span className="muted small">Total</span>
            <strong>{formatCurrency(Math.max(0, subtotal - (Number(form.discount) || 0)))}</strong>
          </div>
        </div>
        <Field label="Notes"><textarea rows={2} value={form.notes} onChange={set('notes')} /></Field>
      </form>
    </Modal>
  );
}

function GenerateModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ period: currentPeriod(), dueDate: '', extraDesc: 'Meals & snacks', extraAmount: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const extraItems = form.extraAmount ? [{ description: form.extraDesc, amount: Number(form.extraAmount) }] : [];
      const res = await api.post('/invoices/generate', { period: form.period, dueDate: form.dueDate, extraItems });
      toast.success(res.data.message);
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
      size="sm"
      title="Generate monthly invoices"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="gen-form" className="btn btn-primary" disabled={saving}>{saving ? 'Generating...' : 'Generate'}</button>
        </>
      }
    >
      <form id="gen-form" className="form" onSubmit={submit}>
        <p className="small muted">Creates a tuition invoice (based on each classroom's monthly fee) for every active child who doesn't already have one for this period.</p>
        <div className="form-row">
          <Field label="Period" required><input type="month" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required /></Field>
          <Field label="Due date" required><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required /></Field>
        </div>
        <div className="form-row">
          <Field label="Extra item (optional)"><input value={form.extraDesc} onChange={(e) => setForm({ ...form, extraDesc: e.target.value })} /></Field>
          <Field label="Amount"><input type="number" min={0} value={form.extraAmount} onChange={(e) => setForm({ ...form, extraAmount: e.target.value })} /></Field>
        </div>
      </form>
    </Modal>
  );
}

function InvoiceView({ invoice, onClose, onPay, isParent }) {
  if (!invoice) return null;
  const subtotal = invoice.items.reduce((s, i) => s + i.amount, 0);
  return (
    <Modal
      open
      onClose={onClose}
      title={`Invoice ${invoice.invoiceNumber}`}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}><FiPrinter /> Print</button>
          {isParent && invoice.status === 'unpaid' && (
            <button type="button" className="btn btn-primary" onClick={() => onPay(invoice)}><FiCreditCard /> Pay now</button>
          )}
        </>
      }
    >
      <div className="invoice print-area">
        <div className="invoice-head">
          <div>
            <div className="brand small-brand"><span className="brand-mark">360</span><strong>ChildCare</strong></div>
            <p className="muted small">Smart Daycare Management</p>
          </div>
          <div className="text-right">
            <Badge tone={invoiceTone(invoice)}>{invoiceLabel(invoice)}</Badge>
            <p className="small">Period: <strong>{formatPeriod(invoice.period)}</strong></p>
            <p className="small">Due: <strong>{formatDate(invoice.dueDate)}</strong></p>
          </div>
        </div>
        <div className="info-grid">
          <div className="info"><span className="info-label">Child</span><span>{childName(invoice.child)}</span></div>
          <div className="info"><span className="info-label">Billed to</span><span>{invoice.parent?.name || '—'}</span></div>
        </div>
        <table className="table">
          <thead><tr><th>Description</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            {invoice.items.map((i) => <tr key={i.description}><td>{i.description}</td><td className="text-right">{formatCurrency(i.amount)}</td></tr>)}
            <tr><td className="text-right muted">Subtotal</td><td className="text-right">{formatCurrency(subtotal)}</td></tr>
            {invoice.discount > 0 && <tr><td className="text-right muted">Discount</td><td className="text-right">- {formatCurrency(invoice.discount)}</td></tr>}
            <tr className="total-row"><td className="text-right">Total</td><td className="text-right">{formatCurrency(invoice.total)}</td></tr>
          </tbody>
        </table>
        {invoice.status === 'paid' && (
          <p className="small text-green"><FiCheckCircle /> Paid on {formatDate(invoice.paidAt)} via {capitalize(invoice.paymentMethod || '')}{invoice.paymentReference ? ` (Ref: ${invoice.paymentReference})` : ''}</p>
        )}
        {invoice.notes && <p className="muted small">Notes: {invoice.notes}</p>}
      </div>
    </Modal>
  );
}

function PaymentModal({ invoice, isParent, onClose, onDone }) {
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await api.put(`/invoices/${invoice._id}/pay`, { paymentMethod: method, paymentReference: reference || undefined });
      toast.success(isParent ? 'Payment successful. Thank you!' : 'Payment recorded');
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
      size="sm"
      onClose={onClose}
      title={isParent ? 'Pay invoice' : 'Record payment'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Processing...' : isParent ? `Pay ${formatCurrency(invoice.total)}` : 'Mark as paid'}
          </button>
        </>
      }
    >
      <p>{invoice.invoiceNumber} · {childName(invoice.child)} · <strong>{formatCurrency(invoice.total)}</strong></p>
      {isParent ? (
        <div className="alert alert-info"><FiAlertCircle /> This is a simulated online payment for demonstration. Connect a payment gateway (e.g. PayHere or Stripe) for real payments.</div>
      ) : (
        <div className="form">
          <Field label="Payment method">
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="online">Online</option>
            </select>
          </Field>
          <Field label="Reference (optional)"><input value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
        </div>
      )}
    </Modal>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const isParent = user.role === 'parent';
  const [filters, setFilters] = useState({ status: '', period: '' });
  const [modal, setModal] = useState(null); // 'new' | 'generate'
  const [viewing, setViewing] = useState(null);
  const [paying, setPaying] = useState(null);

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const { data, loading, error, reload } = useFetch('/invoices', params);
  const invoices = data?.data || [];
  const s = data?.summary;

  const act = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      reload(true);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle={isParent ? 'View and pay your invoices.' : 'Manage tuition invoices and payments.'}
        actions={!isParent && (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setModal('generate')}><FiZap /> Generate monthly</button>
            <button type="button" className="btn btn-primary" onClick={() => setModal('new')}><FiPlus /> New invoice</button>
          </>
        )}
      />

      {s && (
        <div className="stat-grid three">
          <StatCard icon={FiDollarSign} tone="amber" label="Outstanding" value={formatCurrency(s.outstanding)} />
          <StatCard icon={FiAlertCircle} tone="red" label="Overdue" value={formatCurrency(s.overdue)} />
          <StatCard icon={FiCheckCircle} tone="green" label="Paid (shown)" value={formatCurrency(s.paid)} />
        </div>
      )}

      <div className="toolbar">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="month" value={filters.period} onChange={(e) => setFilters({ ...filters, period: e.target.value })} />
        {filters.period && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFilters({ ...filters, period: '' })}>All periods</button>}
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && invoices.length === 0 && <EmptyState icon={FiCreditCard} title="No invoices found" />}

      {invoices.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr><th>Invoice</th><th>Child</th><th>Period</th><th>Total</th><th>Due</th><th>Status</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td><strong>{inv.invoiceNumber}</strong></td>
                  <td>{childName(inv.child)}</td>
                  <td>{formatPeriod(inv.period)}</td>
                  <td>{formatCurrency(inv.total)}</td>
                  <td>{formatDate(inv.dueDate)}</td>
                  <td><Badge tone={invoiceTone(inv)}>{invoiceLabel(inv)}</Badge></td>
                  <td>
                    <div className="row-actions end">
                      <button type="button" className="icon-btn" title="View" onClick={() => setViewing(inv)}><FiEye /></button>
                      {inv.status === 'unpaid' && (
                        <button type="button" className={isParent ? 'btn btn-primary btn-sm' : 'icon-btn'} title={isParent ? undefined : 'Record payment'} onClick={() => setPaying(inv)}>
                          {isParent ? 'Pay' : <FiDollarSign />}
                        </button>
                      )}
                      {!isParent && inv.status === 'unpaid' && (
                        <button type="button" className="icon-btn" title="Cancel invoice" onClick={() => window.confirm('Cancel this invoice?') && act(() => api.put(`/invoices/${inv._id}/cancel`), 'Invoice cancelled')}><FiXCircle /></button>
                      )}
                      {!isParent && (
                        <button type="button" className="icon-btn danger" title="Delete" onClick={() => window.confirm('Delete this invoice permanently?') && act(() => api.delete(`/invoices/${inv._id}`), 'Invoice deleted')}><FiTrash2 /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isParent && <InvoiceForm open={modal === 'new'} onClose={() => setModal(null)} onSaved={() => reload(true)} />}
      {!isParent && <GenerateModal open={modal === 'generate'} onClose={() => setModal(null)} onSaved={() => reload(true)} />}
      <InvoiceView invoice={viewing} isParent={isParent} onClose={() => setViewing(null)} onPay={(inv) => { setViewing(null); setPaying(inv); }} />
      {paying && <PaymentModal invoice={paying} isParent={isParent} onClose={() => setPaying(null)} onDone={() => reload(true)} />}
    </div>
  );
}