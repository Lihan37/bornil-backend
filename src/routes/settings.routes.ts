import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { settingsSchema } from '../validators/settings.validator';

const router = Router();

router.get('/', getSettings);
router.put('/admin', requireAuth, requireAdmin, validateBody(settingsSchema), updateSettings);

export default router;
