import { Router } from 'express';
import { approveOrderEdit, createOrder, getAdminOrders, getMyOrders, rejectOrderEdit, requestOrderEdit, updateOrderStatus } from '../controllers/order.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { orderEditDecisionSchema, orderEditRequestSchema, orderSchema, orderStatusSchema } from '../validators/order.validator';

const router = Router();

router.post('/', requireAuth, validateBody(orderSchema), createOrder);
router.get('/my-orders', requireAuth, getMyOrders);
router.patch('/:id/edit-request', requireAuth, validateBody(orderEditRequestSchema), requestOrderEdit);
router.get('/admin', requireAuth, requireAdmin, getAdminOrders);
router.patch('/admin/:id/status', requireAuth, requireAdmin, validateBody(orderStatusSchema), updateOrderStatus);
router.patch('/admin/:id/edit-request/approve', requireAuth, requireAdmin, validateBody(orderEditDecisionSchema), approveOrderEdit);
router.patch('/admin/:id/edit-request/reject', requireAuth, requireAdmin, validateBody(orderEditDecisionSchema), rejectOrderEdit);

export default router;