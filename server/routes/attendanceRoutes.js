import { Router } from 'express';
import {
  getDailyRoster, getAttendance, checkIn, checkOut, markAbsent, deleteAttendance,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getAttendance);
router.get('/daily', authorize('admin', 'staff'), getDailyRoster);
router.post('/check-in', authorize('admin', 'staff'), checkIn);
router.post('/check-out', authorize('admin', 'staff'), checkOut);
router.post('/absent', markAbsent);
router.delete('/:id', authorize('admin', 'staff'), deleteAttendance);

export default router;