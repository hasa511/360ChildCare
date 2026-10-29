import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiSend, FiEdit, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';
import api from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { PageHeader, Spinner, EmptyState, Avatar, Badge } from '../components/ui.jsx';
import { capitalize, formatDate, formatTime, getError, timeAgo } from '../utils/format.js';

function NewConversation({ open, onClose, onPick }) {
  const { data } = useFetch(open ? '/users/contacts' : null);
  const [q, setQ] = useState('');
  const contacts = (data?.data || []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title="New message" size="sm">
      <input placeholder="Search people..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <ul className="list contact-pick">
        {contacts.map((c) => (
          <li key={c._id}>
            <button type="button" className="contact-btn" onClick={() => { onPick(c); onClose(); }}>
              <Avatar name={c.name} size={34} />
              <span>
                <strong>{c.name}</strong>
                <span className="muted small"> {c.position || capitalize(c.role)}</span>
              </span>
            </button>
          </li>
        ))}
        {contacts.length === 0 && <p className="muted small">No contacts found.</p>}
      </ul>
    </Modal>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const [active, setActive] = useState(null); // the other user
  const [thread, setThread] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [picker, setPicker] = useState(false);
  const bottomRef = useRef(null);
  const { data: convos, loading, reload } = useFetch('/messages/conversations');

  // Load + poll the open thread
  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    const load = () =>
      api
        .get(`/messages/${active._id}`)
        .then((r) => alive && setThread(r.data.data))
        .catch(() => {});
    load().then(() => reload(true));
    const id = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post('/messages', { recipient: active._id, body: text });
      setThread((t) => [...t, res.data.data]);
      setText('');
      reload(true);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSending(false);
    }
  };

  const list = convos?.data || [];

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle={user.role === 'parent' ? 'Chat with teachers and the daycare office.' : 'Stay in touch with parents and colleagues.'}
        actions={<button type="button" className="btn btn-primary" onClick={() => setPicker(true)}><FiEdit /> New message</button>}
      />
      <div className={active ? 'messenger has-active' : 'messenger'}>
        <div className="convo-list card">
          {loading && <Spinner />}
          {!loading && list.length === 0 && <p className="muted small pad">No conversations yet. Start one with "New message".</p>}
          {list.map((c) => (
            <button
              type="button"
              key={c.user._id}
              className={active?._id === c.user._id ? 'convo active' : 'convo'}
              onClick={() => setActive(c.user)}
            >
              <Avatar name={c.user.name} size={40} />
              <div className="convo-text">
                <div className="convo-top">
                  <strong>{c.user.name}</strong>
                  <span className="muted tiny">{timeAgo(c.lastAt)}</span>
                </div>
                <div className="convo-bottom">
                  <span className="muted small clamp-1">{String(c.lastSender) === String(user._id) ? 'You: ' : ''}{c.lastMessage}</span>
                  {c.unread > 0 && <span className="nav-badge">{c.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="thread card">
          {!active ? (
            <EmptyState icon={FiMessageSquare} title="Select a conversation" message="Choose a conversation or start a new one." />
          ) : (
            <>
              <div className="thread-head">
                <button type="button" className="icon-btn back-btn" onClick={() => setActive(null)} aria-label="Back"><FiArrowLeft /></button>
                <Avatar name={active.name} size={38} />
                <div>
                  <strong>{active.name}</strong>
                  <div><Badge tone="gray">{active.position || capitalize(active.role)}</Badge></div>
                </div>
              </div>
              <div className="thread-body">
                {thread.length === 0 && <p className="muted small center">Say hello 👋</p>}
                {thread.map((m, idx) => {
                  const mine = String(m.sender) === String(user._id);
                  const showDate = idx === 0 || formatDate(thread[idx - 1].createdAt) !== formatDate(m.createdAt);
                  return (
                    <div key={m._id}>
                      {showDate && <div className="date-divider">{formatDate(m.createdAt, { weekday: 'short' })}</div>}
                      <div className={mine ? 'bubble mine' : 'bubble'}>
                        <p>{m.body}</p>
                        <span className="tiny">{formatTime(m.createdAt)}{mine && m.readAt ? ' · Seen' : ''}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form className="thread-input" onSubmit={send}>
                <input placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
                <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()} aria-label="Send"><FiSend /></button>
              </form>
            </>
          )}
        </div>
      </div>
      <NewConversation open={picker} onClose={() => setPicker(false)} onPick={(c) => { setThread([]); setActive(c); }} />
    </div>
  );
}