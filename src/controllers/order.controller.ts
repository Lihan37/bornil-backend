import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { adminPhones } from '../config/env';
import { getDB } from '../db/connectDB';
import type { DeliveryArea, Order, OrderItem, Product, User } from '../types';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { signToken } from '../utils/jwt';
import { toObjectId } from '../utils/objectId';
import { sanitizeUser } from '../utils/sanitize';

const deliveryCharges: Record<DeliveryArea, number> = {
  inside_dhaka: 70,
  outside_dhaka: 130,
};

const editableStatuses = new Set(['pending', 'confirmed', 'processing']);

function subtotal(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function itemKey(item: Pick<OrderItem, 'productId'>) {
  return item.productId.toString();
}

async function resolveOrderUser() {
  return null;
}

async function findOrCreateCheckoutUser(payload: { name: string; phone: string; email?: string; password?: string }, authenticatedUserId?: string) {
  const db = getDB();
  if (authenticatedUserId) {
    const user = await db.collection<User>('users').findOne({ _id: toObjectId(authenticatedUserId) });
    if (!user) throw new AppError(401, 'Invalid user');
    return { user, auth: undefined };
  }

  const existing = await db.collection<User>('users').findOne({ phone: payload.phone });
  if (existing) return { user: existing, auth: undefined };
  if (!payload.password) throw new AppError(400, 'Password is required to create your account with this order');

  const now = new Date();
  const user: User = {
    name: payload.name,
    phone: payload.phone,
    passwordHash: await bcrypt.hash(payload.password, 12),
    role: adminPhones.includes(payload.phone) ? 'admin' : 'user',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  if (payload.email) user.email = payload.email;

  const result = await db.collection<User>('users').insertOne(user);
  const savedUser = { ...user, _id: result.insertedId };
  const token = signToken({ userId: result.insertedId.toString(), role: savedUser.role });
  return { user: savedUser, auth: { token, user: sanitizeUser(savedUser) } };
}

function buildRequestedItems(order: Order, requested: Array<{ productId: string; quantity: number }>) {
  const requestedMap = new Map(requested.map((item) => [item.productId, item.quantity]));
  const knownIds = new Set(order.items.map(itemKey));

  for (const productId of requestedMap.keys()) {
    if (!knownIds.has(productId)) throw new AppError(400, 'Only existing order products can be edited');
  }

  const requestedItems = order.items.map((item) => ({
    ...item,
    quantity: requestedMap.get(itemKey(item)) ?? item.quantity,
  }));

  if (!requestedItems.some((item) => item.quantity > 0)) throw new AppError(400, 'Order must keep at least one product');
  if (!requestedItems.some((item) => item.quantity !== order.items.find((current) => itemKey(current) === itemKey(item))?.quantity)) {
    throw new AppError(400, 'No quantity changes requested');
  }

  return requestedItems;
}

async function assertExtraStock(items: OrderItem[], requestedItems: OrderItem[]) {
  const db = getDB();
  for (const requestedItem of requestedItems) {
    const current = items.find((item) => itemKey(item) === itemKey(requestedItem));
    const extraQuantity = requestedItem.quantity - (current?.quantity ?? 0);
    if (extraQuantity <= 0) continue;

    const product = await db.collection<Product>('products').findOne({ _id: requestedItem.productId }, { projection: { stock: 1, name: 1 } });
    if (!product || product.stock < extraQuantity) {
      throw new AppError(400, `${requestedItem.name} does not have enough stock for this edit`);
    }
  }
}

export const createOrder = asyncHandler(async (req, res) => {
  const db = getDB();
  const { user, auth } = await findOrCreateCheckoutUser(
    { name: req.body.customerName, phone: req.body.phone, email: req.body.email, password: req.body.password },
    req.user?.userId,
  );
  const productIds = req.body.items.map((item: { productId: string }) => toObjectId(item.productId));
  const products = await db.collection<Product>('products').find({ _id: { $in: productIds }, status: 'active' }).toArray();
  const productMap = new Map(products.map((product) => [product._id!.toString(), product]));

  const items: OrderItem[] = req.body.items.map((item: { productId: string; quantity: number }) => {
    const product = productMap.get(item.productId);
    if (!product) throw new AppError(404, 'Product not found');
    if (product.stock < item.quantity) throw new AppError(400, `${product.name} does not have enough stock`);
    return {
      productId: product._id!,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url,
      price: product.price,
      quantity: item.quantity,
    };
  });

  const subtotalAmount = subtotal(items);
  const deliveryArea = req.body.deliveryArea as DeliveryArea;
  const deliveryCharge = deliveryCharges[deliveryArea];
  const totalAmount = subtotalAmount + deliveryCharge;
  const now = new Date();
  const order: Order = {
    userId: user._id,
    customerName: req.body.customerName,
    phone: req.body.phone,
    address: req.body.address,
    deliveryArea,
    deliveryCharge,
    subtotalAmount,
    items,
    totalAmount,
    paymentMethod: 'cash_on_delivery',
    orderStatus: 'pending',
    inventoryRestored: false,
    createdAt: now,
    updatedAt: now,
  };

  const session = db.client.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of items) {
        await db.collection<Product>('products').updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity }, $set: { updatedAt: now } },
          { session },
        );
      }
      await db.collection<Order>('orders').insertOne(order, { session });
    });
  } finally {
    await session.endSession();
  }

  successResponse(res, 201, 'Order placed', { order, auth });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await getDB()
    .collection<Order>('orders')
    .find({ userId: toObjectId(req.user!.userId) })
    .sort({ createdAt: -1 })
    .toArray();
  successResponse(res, 200, 'Orders loaded', orders);
});

export const getAdminOrders = asyncHandler(async (_req, res) => {
  const orders = await getDB().collection<Order>('orders').find({}).sort({ createdAt: -1 }).toArray();
  successResponse(res, 200, 'Orders loaded', orders);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const db = getDB();
  const order = await db.collection<Order>('orders').findOne({ _id: toObjectId(req.params.id) });
  if (!order) throw new AppError(404, 'Order not found');
  if (order.orderStatus === 'cancelled' && req.body.orderStatus !== 'cancelled') {
    throw new AppError(400, 'Cancelled orders cannot be reopened');
  }

  const now = new Date();
  let updatedOrder: Order | null = null;
  const session = db.client.startSession();
  try {
    await session.withTransaction(async () => {
      if (req.body.orderStatus === 'cancelled' && !order.inventoryRestored) {
        for (const item of order.items) {
          await db.collection<Product>('products').updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity }, $set: { updatedAt: now } },
            { session },
          );
        }
      }

      updatedOrder = await db.collection<Order>('orders').findOneAndUpdate(
        { _id: order._id },
        {
          $set: {
            orderStatus: req.body.orderStatus,
            inventoryRestored: req.body.orderStatus === 'cancelled' ? true : order.inventoryRestored ?? false,
            updatedAt: now,
          },
        },
        { returnDocument: 'after', session },
      );
    });
  } finally {
    await session.endSession();
  }

  successResponse(res, 200, 'Order status updated', updatedOrder);
});

export const requestOrderEdit = asyncHandler(async (req, res) => {
  const db = getDB();
  const order = await db.collection<Order>('orders').findOne({ _id: toObjectId(req.params.id), userId: toObjectId(req.user!.userId) });
  if (!order) throw new AppError(404, 'Order not found');
  if (!editableStatuses.has(order.orderStatus)) throw new AppError(400, 'This order can no longer be edited');
  if (order.editRequest?.status === 'pending') throw new AppError(409, 'An edit request is already pending');

  const requestedItems = buildRequestedItems(order, req.body.items);
  await assertExtraStock(order.items, requestedItems);

  const requestedSubtotalAmount = subtotal(requestedItems.filter((item) => item.quantity > 0));
  const requestedTotalAmount = requestedSubtotalAmount + (order.deliveryCharge ?? deliveryCharges[order.deliveryArea]);
  const now = new Date();

  const result = await db.collection<Order>('orders').findOneAndUpdate(
    { _id: order._id },
    {
      $set: {
        editRequest: {
          status: 'pending',
          requestedItems,
          requestedSubtotalAmount,
          requestedTotalAmount,
          note: req.body.note,
          requestedAt: now,
        },
        updatedAt: now,
      },
    },
    { returnDocument: 'after' },
  );

  successResponse(res, 200, 'Order edit request submitted', result);
});

export const approveOrderEdit = asyncHandler(async (req, res) => {
  const db = getDB();
  const order = await db.collection<Order>('orders').findOne({ _id: toObjectId(req.params.id) });
  if (!order) throw new AppError(404, 'Order not found');
  if (order.editRequest?.status !== 'pending') throw new AppError(400, 'No pending edit request found');

  const now = new Date();
  const requestedItems = order.editRequest.requestedItems.filter((item) => item.quantity > 0);
  const requestedSubtotalAmount = subtotal(requestedItems);
  const deliveryCharge = order.deliveryCharge ?? deliveryCharges[order.deliveryArea];
  const requestedTotalAmount = requestedSubtotalAmount + deliveryCharge;

  const session = db.client.startSession();
  let updatedOrder: Order | null = null;
  try {
    await session.withTransaction(async () => {
      for (const requestedItem of order.editRequest!.requestedItems) {
        const current = order.items.find((item) => itemKey(item) === itemKey(requestedItem));
        const delta = requestedItem.quantity - (current?.quantity ?? 0);
        if (delta === 0) continue;

        const update = delta > 0
          ? { $inc: { stock: -delta }, $set: { updatedAt: now } }
          : { $inc: { stock: Math.abs(delta) }, $set: { updatedAt: now } };
        const filter = delta > 0
          ? { _id: requestedItem.productId, stock: { $gte: delta } }
          : { _id: requestedItem.productId };

        const stockResult = await db.collection<Product>('products').updateOne(filter, update, { session });
        if (!stockResult.modifiedCount) throw new AppError(400, `${requestedItem.name} does not have enough stock for approval`);
      }

      updatedOrder = await db.collection<Order>('orders').findOneAndUpdate(
        { _id: order._id },
        {
          $set: {
            items: requestedItems,
            subtotalAmount: requestedSubtotalAmount,
            totalAmount: requestedTotalAmount,
            'editRequest.status': 'approved',
            'editRequest.adminNote': req.body.adminNote,
            'editRequest.respondedAt': now,
            updatedAt: now,
          },
        },
        { returnDocument: 'after', session },
      );
    });
  } finally {
    await session.endSession();
  }

  successResponse(res, 200, 'Order edit request approved', updatedOrder);
});

export const rejectOrderEdit = asyncHandler(async (req, res) => {
  const now = new Date();
  const result = await getDB().collection<Order>('orders').findOneAndUpdate(
    { _id: toObjectId(req.params.id), 'editRequest.status': 'pending' },
    {
      $set: {
        'editRequest.status': 'rejected',
        'editRequest.adminNote': req.body.adminNote,
        'editRequest.respondedAt': now,
        updatedAt: now,
      },
    },
    { returnDocument: 'after' },
  );
  if (!result) throw new AppError(404, 'Pending edit request not found');
  successResponse(res, 200, 'Order edit request rejected', result);
});