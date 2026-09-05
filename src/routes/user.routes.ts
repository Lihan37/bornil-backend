import { Router } from 'express';
import { approvePasswordReset, deleteUser, getAdminUsers, rejectPasswordReset, updateUserStatus } from '../controllers/user.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { passwordResetDecisionSchema, userStatusSchema } from '../validators/user.validator';

const router = Router();

router.get('/admin', requireAuth, requireAdmin, getAdminUsers);
router.patch('/admin/:id/status', requireAuth, requireAdmin, validateBody(userStatusSchema), updateUserStatus);
router.patch('/admin/:id/password-reset/approve', requireAuth, requireAdmin, validateBody(passwordResetDecisionSchema), approvePasswordReset);
router.patch('/admin/:id/password-reset/reject', requireAuth, requireAdmin, validateBody(passwordResetDecisionSchema), rejectPasswordReset);
router.delete('/admin/:id', requireAuth, requireAdmin, deleteUser);

export default router;