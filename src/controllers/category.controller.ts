import { getDB } from '../db/connectDB';
import type { Category } from '../types';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { toObjectId } from '../utils/objectId';
import { slugify } from '../utils/slugify';

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await getDB().collection<Category>('categories').find({}).sort({ name: 1 }).toArray();
  successResponse(res, 200, 'Categories loaded', categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const db = getDB();
  const now = new Date();
  const category: Category = {
    name: req.body.name,
    slug: slugify(req.body.name),
    image: req.body.image || undefined,
    isFeatured: req.body.isFeatured ?? false,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection<Category>('categories').insertOne(category);
  successResponse(res, 201, 'Category created', { ...category, _id: result.insertedId });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const db = getDB();
  const id = toObjectId(req.params.id);
  const update = {
    name: req.body.name,
    slug: slugify(req.body.name),
    image: req.body.image || undefined,
    isFeatured: req.body.isFeatured ?? false,
    updatedAt: new Date(),
  };
  const result = await db.collection<Category>('categories').findOneAndUpdate({ _id: id }, { $set: update }, { returnDocument: 'after' });
  if (!result) throw new AppError(404, 'Category not found');
  successResponse(res, 200, 'Category updated', result);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await getDB().collection<Category>('categories').deleteOne({ _id: toObjectId(req.params.id) });
  if (!result.deletedCount) throw new AppError(404, 'Category not found');
  successResponse(res, 200, 'Category deleted');
});
