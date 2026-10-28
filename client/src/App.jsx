import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Children from './pages/Children.jsx';
import Classrooms from './pages/Classrooms.jsx';
import Attendance from './pages/Attendance.jsx';
import Activities from './pages/Activities.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner full />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/children" replace />} />
        <Route path="children" element={<Children />} />
        <Route path="classrooms" element={<ProtectedRoute roles={['admin', 'staff']}><Classrooms /></ProtectedRoute>} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="activities" element={<Activities />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}