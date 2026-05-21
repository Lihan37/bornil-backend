import type { Filter, Sort } from 'mongodb';
import { cloudinary } from '../config/cloudinary';
import { getDB } from '../db/connectDB';
import type { Product, ProductImage } from '../types';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { toObjectId } from '../utils/objectId';
import { slugify } from '../utils/slugify';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uploadedImages(files: Express.Multer.File[] = []) {
  return files.map((file) => ({
    url: file.path,
    publicId: file.filename,
  }));
}

async function deleteCloudinaryImages(images: ProductImage[]) {
  await Promise.all(images.filter((image) => image.publicId).map((image) => cloudinary.uploader.destroy(image.publicId)));
}

export const getProducts = asyncHandler(async (req, res) => {
  const db = getDB();
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 48);
  const skip = (page - 1) * limit;
  const filter: Filter<Product> = { status: 'active' };

  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.search) {
    const search = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [{ name: search }, { description: search }, { category: search }];
  }
  if (req.query.availability === 'in-stock') filter.stock = { $gt: 0 };
  if (req.query.availability === 'out-of-stock') filter.stock = 0;
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.bestSelling === 'true') filter.isBestSelling = true;

  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    filter.price = {};
    if (!Number.isNaN(minPrice)) filter.price.$gte = minPrice;
    if (!Number.isNaN(maxPrice)) filter.price.$lte = maxPrice;
  }

  const sort: Sort =
    req.query.sort === 'price-low-high'
      ? { price: 1 }
      : req.query.sort === 'price-high-low'
        ? { price: -1 }
        : { createdAt: -1 };

  const [products, total] = await Promise.all([
    db.collection<Product>('products').find(filter).sort(sort).skip(skip).limit(limit).toArray(),
    db.collection<Product>('products').countDocuments(filter),
  ]);

  successResponse(res, 200, 'Products loaded', products, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await getDB().collection<Product>('products').findOne({ _id: toObjectId(req.params.id), status: 'active' });
  if (!product) throw new AppError(404, 'Product not found');
  successResponse(res, 200, 'Product loaded', product);
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await getDB().collection<Product>('products').findOne({ slug: req.params.slug, status: 'active' });
  if (!product) throw new AppError(404, 'Product not found');
  successResponse(res, 200, 'Product loaded', product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const images = uploadedImages(files);
  if (!images.length) throw new AppError(400, 'At least one product image is required');

  const now = new Date();
  const product: Product = {
    name: req.body.name,
    slug: `${slugify(req.body.name)}-${Date.now()}`,
    category: req.body.category,
    price: req.body.price,
    oldPrice: req.body.oldPrice,
    description: req.body.description,
    images,
    material: req.body.material,
    color: req.body.color,
    size: req.body.size,
    stock: req.body.stock,
    isFeatured: req.body.isFeatured,
    isBestSelling: req.body.isBestSelling,
    status: req.body.status,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getDB().collection<Product>('products').insertOne(product);
  successResponse(res, 201, 'Product created', { ...product, _id: result.insertedId });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const db = getDB();
  const id = toObjectId(req.params.id);
  const existing = await db.collection<Product>('products').findOne({ _id: id });
  if (!existing) throw new AppError(404, 'Product not found');

  const files = req.files as Express.Multer.File[] | undefined;
  const nextImages = [...(req.body.existingImages || []), ...uploadedImages(files)];
  if (!nextImages.length) throw new AppError(400, 'At least one product image is required');

  const removedImages = existing.images.filter((image) => !nextImages.some((next) => next.publicId === image.publicId));
  await deleteCloudinaryImages(removedImages);

  const { existingImages: _existingImages, ...body } = req.body;
  const update: Partial<Product> = {
    ...body,
    images: nextImages,
    slug: req.body.name ? `${slugify(req.body.name)}-${existing._id!.toString().slice(-6)}` : existing.slug,
    updatedAt: new Date(),
  };

  const result = await db.collection<Product>('products').findOneAndUpdate({ _id: id }, { $set: update }, { returnDocument: 'after' });
  successResponse(res, 200, 'Product updated', result);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const db = getDB();
  const product = await db.collection<Product>('products').findOne({ _id: toObjectId(req.params.id) });
  if (!product) throw new AppError(404, 'Product not found');
  await deleteCloudinaryImages(product.images);
  await db.collection<Product>('products').deleteOne({ _id: product._id });
  successResponse(res, 200, 'Product deleted');
});
