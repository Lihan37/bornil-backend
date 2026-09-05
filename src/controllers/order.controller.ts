import { ObjectId } from 'mongodb';
import { getDB } from '../db/connectDB';
import type { DeliveryArea, Order, OrderItem, Product } from '../types';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { toObjectId } from '../utils/objectId';

const deliveryCharges: Record<DeliveryArea, number> = {
  inside_dhaka: 70,
  outside_dhaka: 130,
};

export const createOrder = asyncHandler(async (req, res) => {
  const db = getDB();
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

  const subtotalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryArea = req.body.deliveryArea as DeliveryArea;
  const deliveryCharge = deliveryCharges[deliveryArea];
  const totalAmount = subtotalAmount + deliveryCharge;
  const now = new Date();
  const order: Order = {
    userId: req.user?.userId ? new ObjectId(req.user.userId) : undefined,
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

  successResponse(res, 201, 'Order placed', order);
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
  const result = await getDB()
    .collection<Order>('orders')
    .findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: { orderStatus: req.body.orderStatus, updatedAt: new Date() } },
      { returnDocument: 'after' },
    );
  if (!result) throw new AppError(404, 'Order not found');
  successResponse(res, 200, 'Order status updated', result);
});
