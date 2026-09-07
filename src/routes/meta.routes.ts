import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { relayMetaEvent } from '../controllers/meta.controller';
import { optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { metaEventSchema } from '../validators/meta.validator';

const router = Router();

router.post(
  '/events',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  optionalAuth,
  validateBody(metaEventSchema),
  relayMetaEvent,
);

export default router;

