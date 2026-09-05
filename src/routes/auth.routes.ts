import { Router } from 'express';
import { login, me, register, requestPasswordReset, updateProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { loginSchema, passwordResetRequestSchema, registerSchema } from '../validators/auth.validator';
import { z } from 'zod';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/password-reset/request', validateBody(passwordResetRequestSchema), requestPasswordReset);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, validateBody(z.object({ name: z.string().min(2).max(80), email: z.string().email().optional().or(z.literal('')) })), updateProfile);

export default router;