import { Router } from 'express';
import { getActivities, createActivity, updateActivity, deleteActivity } from '../controllers/activityController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.route('/').get(getActivities).post(authorize('admin', 'staff'), createActivity);
router.route('/:id').put(authorize('admin', 'staff'), updateActivity).delete(authorize('admin', 'staff'), deleteActivity);

export default router;