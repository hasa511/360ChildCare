   import { Router } from 'express';
   import { register, login, getMe, updateMe, changePassword } from '../controllers/authController.js';
   import { protect } from '../middleware/auth.js';

   const router = Router();

   router.post('/register', register);
   router.post('/login', login);
   router.route('/me').get(protect, getMe).put(protect, updateMe);
   router.put('/change-password', protect, changePassword);

   export default router;