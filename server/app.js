import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

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

// In production, serve the built React app from client/dist
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

export default app;