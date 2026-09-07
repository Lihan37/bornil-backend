import crypto from 'crypto';
import { env } from '../config/env';
import type { Order, OrderItem, Product, User } from '../types';

export type MetaEventName = 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';

export type BrowserTrackingContext = {
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
};

export type MetaContent = {
  id: string;
  quantity: number;
  item_price: number;
};

type CustomerInput = {
  email?: string;
  phone?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
};

type SendMetaEventInput = {
  eventName: MetaEventName;
  eventId: string;
  eventSourceUrl?: string;
  userData: CustomerInput;
  customData: Record<string, unknown>;
};

const CURRENCY = 'BDT';
const META_TIMEOUT_MS = 2500;

export function metaProductId(productOrItem: Pick<Product, '_id'> | Pick<OrderItem, 'productId'>) {
  return 'productId' in productOrItem ? productOrItem.productId.toString() : productOrItem._id!.toString();
}

export function normalizeEmail(email?: string) {
  const value = email?.trim().toLowerCase();
  return value || undefined;
}

export function normalizePhone(phone?: string) {
  const digits = phone?.replace(/\D/g, '');
  return digits || undefined;
}

export function sha256(value?: string) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hashedUserData(input: CustomerInput) {
  const data: Record<string, string> = {};
  const emailHash = sha256(normalizeEmail(input.email));
  const phoneHash = sha256(normalizePhone(input.phone));
  if (emailHash) data.em = emailHash;
  if (phoneHash) data.ph = phoneHash;
  if (input.clientIp) data.client_ip_address = input.clientIp;
  if (input.userAgent) data.client_user_agent = input.userAgent;
  if (input.fbp) data.fbp = input.fbp;
  if (input.fbc) data.fbc = input.fbc;
  return data;
}

export function contentsFromProducts(products: Product[], requested: Array<{ productId: string; quantity: number }>) {
  const quantityById = new Map(requested.map((item) => [item.productId, item.quantity]));
  return products.map((product) => ({
    id: metaProductId(product),
    quantity: quantityById.get(product._id!.toString()) ?? 1,
    item_price: product.price,
  }));
}

export function contentsFromOrder(order: Pick<Order, 'items'>) {
  return order.items.map((item) => ({
    id: metaProductId(item),
    quantity: item.quantity,
    item_price: item.price,
  }));
}

export function productCustomData(products: Product[], requested: Array<{ productId: string; quantity: number }>) {
  const contents = contentsFromProducts(products, requested);
  return {
    content_ids: contents.map((item) => item.id),
    contents,
    content_type: 'product',
    value: contents.reduce((sum, item) => sum + item.item_price * item.quantity, 0),
    currency: CURRENCY,
    num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function orderCustomData(order: Order) {
  const contents = contentsFromOrder(order);
  return {
    content_ids: contents.map((item) => item.id),
    contents,
    content_type: 'product',
    value: order.totalAmount,
    currency: CURRENCY,
    num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
    order_id: order._id?.toString(),
  };
}

export async function sendMetaCapiEvent(input: SendMetaEventInput) {
  if (!env.META_PIXEL_ID || !env.META_CAPI_ACCESS_TOKEN) return { skipped: true as const };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_TIMEOUT_MS);
  const url = new URL(`https://graph.facebook.com/${env.META_CAPI_API_VERSION}/${env.META_PIXEL_ID}/events`);
  url.searchParams.set('access_token', env.META_CAPI_ACCESS_TOKEN);

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        event_source_url: input.eventSourceUrl,
        user_data: hashedUserData(input.userData),
        custom_data: input.customData,
      },
    ],
  };
  if (env.META_CAPI_TEST_EVENT_CODE) payload.test_event_code = env.META_CAPI_TEST_EVENT_CODE;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn('Meta CAPI event failed', { eventName: input.eventName, eventId: input.eventId, status: response.status });
      return { skipped: false as const, ok: false as const, status: response.status };
    }

    return { skipped: false as const, ok: true as const, status: response.status };
  } catch (error) {
    console.warn('Meta CAPI event error', { eventName: input.eventName, eventId: input.eventId, reason: error instanceof Error ? error.name : 'unknown' });
    return { skipped: false as const, ok: false as const, status: 0 };
  } finally {
    clearTimeout(timeout);
  }
}

export function userDataFromOrder(user: User | null | undefined, order: Pick<Order, 'phone'>, tracking: BrowserTrackingContext | undefined, clientIp?: string, userAgent?: string) {
  return {
    email: user?.email,
    phone: order.phone || user?.phone,
    fbp: tracking?.fbp,
    fbc: tracking?.fbc,
    clientIp,
    userAgent,
  };
}
