import { Router } from 'express';
import { createProduct, deleteProduct, getAdminProducts, getProductById, getProductBySlug, getProductFeed, getProducts, updateProduct } from '../controllers/product.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { uploadProductImages } from '../middleware/upload';
import { validateBody } from '../middleware/validateRequest';
import { productSchema, productUpdateSchema } from '../validators/product.validator';

const router = Router();

router.get('/', getProducts);
router.get('/feed.xml', getProductFeed);
router.get('/admin/list', requireAuth, requireAdmin, getAdminProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
router.post('/admin', requireAuth, requireAdmin, uploadProductImages, validateBody(productSchema), createProduct);
router.patch('/admin/:id', requireAuth, requireAdmin, uploadProductImages, validateBody(productUpdateSchema), updateProduct);
router.delete('/admin/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
