import type { ObjectId } from 'mongodb';

export type Role = 'user' | 'admin';
export type ProductStatus = 'active' | 'draft' | 'archived';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type User = {
  _id?: ObjectId;
  name: string;
  phone: string;
  email?: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductImage = {
  url: string;
  publicId: string;
};

export type Product = {
  _id?: ObjectId;
  name: string;
  slug: string;
  category: string;
  price: number;
  oldPrice?: number;
  description: string;
  images: ProductImage[];
  material: string;
  color: string;
  size: string;
  stock: number;
  isFeatured: boolean;
  isBestSelling: boolean;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  _id?: ObjectId;
  name: string;
  slug: string;
  image?: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItem = {
  productId: ObjectId;
  name: string;
  slug: string;
  image?: string;
  price: number;
  quantity: number;
};

export type Order = {
  _id?: ObjectId;
  userId?: ObjectId;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash_on_delivery';
  orderStatus: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthPayload = {
  userId: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
