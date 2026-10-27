import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser, getContacts } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/contacts', getContacts);
router.route('/').get(authorize('admin', 'staff'), getUsers).post(authorize('admin'), createUser);
router
  .route('/:id')
  .get(authorize('admin'), getUser)
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

export default router;