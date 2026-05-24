import express from 'express';
import { applyAlumni, getApplications, approveApplication, rejectApplication } from '../controllers/alumniController.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// Public route for alumni to apply
router.post('/apply', applyAlumni);

// Admin only routes
router.use(requireAuth);
router.use(requireRoles(['admin']));

router.get('/applications', getApplications);
router.post('/applications/:id/approve', approveApplication);
router.post('/applications/:id/reject', rejectApplication);

export default router;
