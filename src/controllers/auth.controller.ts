import bcrypt from 'bcryptjs';
import type { UpdateFilter } from 'mongodb';
import { getDB } from '../db/connectDB';
import { adminPhones } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';
import { sanitizeUser } from '../utils/sanitize';
import { successResponse } from '../utils/apiResponse';
import type { User } from '../types';
import { toObjectId } from '../utils/objectId';

export const register = asyncHandler(async (req, res) => {
  const db = getDB();
  const { name, phone, email, password } = req.body;
  const existing = await db.collection<User>('users').findOne({
    $or: [{ phone }, ...(email ? [{ email }] : [])],
  });
  if (existing) throw new AppError(409, 'Account already exists');

  const now = new Date();
  const user: User = {
    name,
    phone,
    passwordHash: await bcrypt.hash(password, 12),
    role: adminPhones.includes(phone) ? 'admin' : 'user',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  if (email) {
    user.email = email;
  }

  const result = await db.collection<User>('users').insertOne(user);
  const savedUser = { ...user, _id: result.insertedId };
  const token = signToken({ userId: result.insertedId.toString(), role: savedUser.role });

  successResponse(res, 201, 'Registered successfully', { token, user: sanitizeUser(savedUser) });
});

export const login = asyncHandler(async (req, res) => {
  const db = getDB();
  const { phone, password } = req.body;
  const user = await db.collection<User>('users').findOne({ phone });
  if (!user) throw new AppError(401, 'Invalid phone or password');
  if (user.status === 'blocked') throw new AppError(403, 'Your account is blocked');

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) throw new AppError(401, 'Invalid phone or password');

  const token = signToken({ userId: user._id!.toString(), role: user.role });
  successResponse(res, 200, 'Logged in successfully', { token, user: sanitizeUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  const db = getDB();
  const user = await db.collection<User>('users').findOne({ _id: toObjectId(req.user!.userId) });
  if (!user) throw new AppError(404, 'User not found');
  if (user.status === 'blocked') throw new AppError(403, 'Your account is blocked');
  successResponse(res, 200, 'Profile loaded', sanitizeUser(user));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const db = getDB();
  const payload = {
    name: req.body.name,
    updatedAt: new Date(),
  };
  const update: UpdateFilter<User> = req.body.email
    ? { $set: { ...payload, email: req.body.email } }
    : { $set: payload, $unset: { email: 1 } };
  await db.collection<User>('users').updateOne(
    { _id: toObjectId(req.user!.userId) },
    update,
  );
  const user = await db.collection<User>('users').findOne({ _id: toObjectId(req.user!.userId) });
  successResponse(res, 200, 'Profile updated', sanitizeUser(user!));
});
