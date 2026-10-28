import { Router } from 'express';
import {
  getIncidents, getIncident, createIncident, updateIncident, acknowledgeIncident, deleteIncident,
} from '../controllers/incidentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.route('/').get(getIncidents).post(authorize('admin', 'staff'), createIncident);
router.put('/:id/acknowledge', authorize('parent'), acknowledgeIncident);
router
  .route('/:id')
  .get(getIncident)
  .put(authorize('admin', 'staff'), updateIncident)
  .delete(authorize('admin'), deleteIncident);

export default router;