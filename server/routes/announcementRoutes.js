import { Router } from 'express';
import {
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.route('/').get(getAnnouncements).post(authorize('admin', 'staff'), createAnnouncement);
router
  .route('/:id')
  .put(authorize('admin', 'staff'), updateAnnouncement)
  .delete(authorize('admin', 'staff'), deleteAnnouncement);

export default router;