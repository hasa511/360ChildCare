import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import childRoutes from './routes/childRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import userRoutes from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { notFound, errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '360ChildCare API is healthy', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);

// In production, serve the built React app from client/dist
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

export default app;