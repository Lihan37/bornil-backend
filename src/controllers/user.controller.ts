import { getDB } from '../db/connectDB';
import type { User } from '../types';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { toObjectId } from '../utils/objectId';

const userProjection = {
  passwordHash: 0,
};

export const getAdminUsers = asyncHandler(async (_req, res) => {
  const users = await getDB()
    .collection<User>('users')
    .find({}, { projection: userProjection })
    .sort({ createdAt: -1 })
    .toArray();

  successResponse(res, 200, 'Users loaded', users);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const targetId = toObjectId(req.params.id);
  if (targetId.toString() === req.user!.userId) {
    throw new AppError(400, 'You cannot block or unblock your own account');
  }

  const result = await getDB()
    .collection<User>('users')
    .findOneAndUpdate(
      { _id: targetId },
      { $set: { status: req.body.status, updatedAt: new Date() } },
      { returnDocument: 'after', projection: userProjection },
    );

  if (!result) throw new AppError(404, 'User not found');
  successResponse(res, 200, 'User status updated', result);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const targetId = toObjectId(req.params.id);
  if (targetId.toString() === req.user!.userId) {
    throw new AppError(400, 'You cannot delete your own account');
  }

  const result = await getDB().collection<User>('users').deleteOne({ _id: targetId });
  if (!result.deletedCount) throw new AppError(404, 'User not found');
  successResponse(res, 200, 'User deleted');
});
