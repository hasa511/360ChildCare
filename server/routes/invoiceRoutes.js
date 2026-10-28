import { Router } from 'express';
import {
  getInvoices, getInvoice, createInvoice, generateMonthlyInvoices, updateInvoice, payInvoice, cancelInvoice, deleteInvoice,
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.route('/').get(authorize('admin', 'parent'), getInvoices).post(authorize('admin'), createInvoice);
router.post('/generate', authorize('admin'), generateMonthlyInvoices);
router.put('/:id/pay', authorize('admin', 'parent'), payInvoice);
router.put('/:id/cancel', authorize('admin'), cancelInvoice);
router
  .route('/:id')
  .get(authorize('admin', 'parent'), getInvoice)
  .put(authorize('admin'), updateInvoice)
  .delete(authorize('admin'), deleteInvoice);

export default router;