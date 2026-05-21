import { Router } from 'express';
import { createOrder, getAdminOrders, getMyOrders, updateOrderStatus } from '../controllers/order.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { orderSchema, orderStatusSchema } from '../validators/order.validator';

const router = Router();

router.post('/', requireAuth, validateBody(orderSchema), createOrder);
router.get('/my-orders', requireAuth, getMyOrders);
router.get('/admin', requireAuth, requireAdmin, getAdminOrders);
router.patch('/admin/:id/status', requireAuth, requireAdmin, validateBody(orderStatusSchema), updateOrderStatus);

export default router;
