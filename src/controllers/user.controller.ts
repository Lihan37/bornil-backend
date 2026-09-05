import { getDB } from '../db/connectDB';
import type { User } from '../types';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { toObjectId } from '../utils/objectId';

const userProjection = {
  passwordHash: 0,
  'passwordResetRequest.requestedPasswordHash': 0,
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

export const approvePasswordReset = asyncHandler(async (req, res) => {
  const targetId = toObjectId(req.params.id);
  const user = await getDB().collection<User>('users').findOne({ _id: targetId, 'passwordResetRequest.status': 'pending' });
  if (!user?.passwordResetRequest?.requestedPasswordHash) throw new AppError(404, 'Pending password reset request not found');

  const result = await getDB()
    .collection<User>('users')
    .findOneAndUpdate(
      { _id: targetId, 'passwordResetRequest.status': 'pending' },
      {
        $set: {
          passwordHash: user.passwordResetRequest.requestedPasswordHash,
          'passwordResetRequest.status': 'approved',
          'passwordResetRequest.adminNote': req.body.adminNote,
          'passwordResetRequest.respondedAt': new Date(),
          updatedAt: new Date(),
        },
        $unset: { 'passwordResetRequest.requestedPasswordHash': 1 },
      },
      { returnDocument: 'after', projection: userProjection },
    );

  if (!result) throw new AppError(404, 'Pending password reset request not found');
  successResponse(res, 200, 'Password reset approved', result);
});

export const rejectPasswordReset = asyncHandler(async (req, res) => {
  const result = await getDB()
    .collection<User>('users')
    .findOneAndUpdate(
      { _id: toObjectId(req.params.id), 'passwordResetRequest.status': 'pending' },
      {
        $set: {
          'passwordResetRequest.status': 'rejected',
          'passwordResetRequest.adminNote': req.body.adminNote,
          'passwordResetRequest.respondedAt': new Date(),
          updatedAt: new Date(),
        },
        $unset: { 'passwordResetRequest.requestedPasswordHash': 1 },
      },
      { returnDocument: 'after', projection: userProjection },
    );

  if (!result) throw new AppError(404, 'Pending password reset request not found');
  successResponse(res, 200, 'Password reset rejected', result);
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