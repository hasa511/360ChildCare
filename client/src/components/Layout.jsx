import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  FiHome, FiSmile, FiGrid, FiCheckSquare, FiBookOpen, FiAlertTriangle, FiCreditCard,
  FiBell, FiMessageSquare, FiUsers, FiLogOut, FiMenu, FiUser,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { Avatar } from './ui.jsx';
import { capitalize } from '../utils/format.js';

const NAV = [
  { to: '/', label: 'Dashboard', icon: FiHome, end: true },
  { to: '/children', label: 'Children', parentLabel: 'My Children', icon: FiSmile },
  { to: '/classrooms', label: 'Classrooms', icon: FiGrid, roles: ['admin', 'staff'] },
  { to: '/attendance', label: 'Attendance', icon: FiCheckSquare },
  { to: '/activities', label: 'Daily Reports', icon: FiBookOpen },
  { to: '/incidents', label: 'Incidents', icon: FiAlertTriangle },
  { to: '/billing', label: 'Billing', icon: FiCreditCard, roles: ['admin', 'parent'] },
  { to: '/announcements', label: 'Announcements', icon: FiBell },
  { to: '/messages', label: 'Messages', icon: FiMessageSquare, badge: 'messages' },
  { to: '/users', label: 'Users', icon: FiUsers, roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Close the mobile menu on navigation
  useEffect(() => setOpen(false), [location.pathname]);

  // Poll unread messages
  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .get('/messages/unread-count')
        .then((r) => active && setUnread(r.data.count))
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [location.pathname]);

  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <Link to="/" className="brand">
          <span className="brand-mark">360</span>
          <span>
            <strong>ChildCare</strong>
            <small>Smart Daycare</small>
          </span>
        </Link>
        <nav className="nav">
          {items.map(({ to, label, parentLabel, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Icon />
              <span>{user.role === 'parent' && parentLabel ? parentLabel : label}</span>
              {badge === 'messages' && unread > 0 && <span className="nav-badge">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="nav-link logout" onClick={handleLogout}>
          <FiLogOut />
          <span>Log out</span>
        </button>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <FiMenu />
          </button>
          <div className="topbar-greeting">
            <strong>
              {greeting}, {user.name.split(' ')[0]}
            </strong>
            <span className="muted">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <Link to="/profile" className="topbar-user">
            <Avatar name={user.name} size={36} />
            <span className="topbar-user-text">
              <strong>{user.name}</strong>
              <small>{user.position || capitalize(user.role)}</small>
            </span>
            <FiUser className="topbar-user-icon" />
          </Link>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}