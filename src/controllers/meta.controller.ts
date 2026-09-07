import { getDB } from '../db/connectDB';
import type { Product, User } from '../types';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { productCustomData, sendMetaCapiEvent } from '../utils/meta';
import { toObjectId } from '../utils/objectId';

export const relayMetaEvent = asyncHandler(async (req, res) => {
  const requestedItems = req.body.items as Array<{ productId: string; quantity: number }>;
  const ids = [...new Set(requestedItems.map((item) => item.productId))];
  const objectIds = ids.map((id) => toObjectId(id));
  const products = await getDB().collection<Product>('products').find({ _id: { $in: objectIds }, status: 'active' }).toArray();

  if (products.length !== ids.length) throw new AppError(404, 'One or more products were not found');

  const user = req.user?.userId ? await getDB().collection<User>('users').findOne({ _id: toObjectId(req.user.userId) }) : null;
  void sendMetaCapiEvent({
    eventName: req.body.eventName,
    eventId: req.body.eventId,
    eventSourceUrl: req.body.eventSourceUrl,
    userData: {
      email: user?.email,
      phone: user?.phone,
      fbp: req.body.fbp,
      fbc: req.body.fbc,
      clientIp: req.ip,
      userAgent: req.get('user-agent'),
    },
    customData: productCustomData(products, requestedItems),
  });

  successResponse(res, 202, 'Meta event accepted');
});
