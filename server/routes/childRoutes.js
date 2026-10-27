import { Router } from 'express';
import { getChildren, getChild, createChild, updateChild, deleteChild } from '../controllers/childController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.route('/').get(getChildren).post(authorize('admin'), createChild);
router.route('/:id').get(getChild).put(authorize('admin'), updateChild).delete(authorize('admin'), deleteChild);

export default router;