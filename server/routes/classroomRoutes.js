import { Router } from 'express';
import {
  getClassrooms, getClassroom, createClassroom, updateClassroom, deleteClassroom,
} from '../controllers/classroomController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.route('/').get(getClassrooms).post(authorize('admin'), createClassroom);
router
  .route('/:id')
  .get(authorize('admin', 'staff'), getClassroom)
  .put(authorize('admin'), updateClassroom)
  .delete(authorize('admin'), deleteClassroom);

export default router;