import type { ObjectId } from 'mongodb';

export type Role = 'user' | 'admin';
export type UserStatus = 'active' | 'blocked';
export type ProductStatus = 'active' | 'draft' | 'archived';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'paid' | 'cancelled';
export type DeliveryArea = 'inside_dhaka' | 'outside_dhaka';

export type User = {
  _id?: ObjectId;
  name: string;
  phone: string;
  email?: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
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
  displayOrder?: number;
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
  deliveryArea: DeliveryArea;
  deliveryCharge: number;
  subtotalAmount: number;
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
