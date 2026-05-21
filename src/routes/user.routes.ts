import { Router } from 'express';
import { deleteUser, getAdminUsers, updateUserStatus } from '../controllers/user.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { userStatusSchema } from '../validators/user.validator';

const router = Router();

router.get('/admin', requireAuth, requireAdmin, getAdminUsers);
router.patch('/admin/:id/status', requireAuth, requireAdmin, validateBody(userStatusSchema), updateUserStatus);
router.delete('/admin/:id', requireAuth, requireAdmin, deleteUser);

export default router;
