import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/category.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { categorySchema } from '../validators/category.validator';

const router = Router();

router.get('/', getCategories);
router.post('/admin', requireAuth, requireAdmin, validateBody(categorySchema), createCategory);
router.patch('/admin/:id', requireAuth, requireAdmin, validateBody(categorySchema), updateCategory);
router.delete('/admin/:id', requireAuth, requireAdmin, deleteCategory);

export default router;
