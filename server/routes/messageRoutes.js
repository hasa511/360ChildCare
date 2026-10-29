import { Router } from 'express';
import { getConversations, getUnreadCount, getThread, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/:userId', getThread);
router.post('/', sendMessage);

export default router;