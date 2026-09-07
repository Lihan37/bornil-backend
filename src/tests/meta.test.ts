import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';

process.env.DB_USER ||= 'test_user';
process.env.DB_PASS ||= 'test_pass';
process.env.DB_NAME ||= 'test_db';
process.env.JWT_SECRET ||= '12345678901234567890123456789012';
process.env.CLIENT_URL ||= 'https://bornilvibes.com';
process.env.CLOUDINARY_CLOUD_NAME ||= 'cloud';
process.env.CLOUDINARY_API_KEY ||= 'key';
process.env.CLOUDINARY_API_SECRET ||= 'secret';
process.env.META_PIXEL_ID ||= '';
process.env.META_CAPI_ACCESS_TOKEN ||= '';

type Product = import('../types').Product;
type Order = import('../types').Order;

const meta = require('../utils/meta') as typeof import('../utils/meta');
const catalog = require('../utils/catalogFeed') as typeof import('../utils/catalogFeed');

const productId = new ObjectId();
const product: Product = {
  _id: productId,
  name: 'Gold & Pearl <Set>',
  slug: 'gold-pearl-set',
  category: 'Necklaces',
  price: 900,
  oldPrice: 1200,
  description: 'Handmade necklace with pearl details.',
  images: [{ url: 'https://cdn.example.com/products/gold.jpg', publicId: 'gold' }],
  material: 'Pearl',
  color: 'Gold',
  size: '',
  stock: 3,
  isFeatured: false,
  isBestSelling: false,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

assert.equal(meta.metaProductId(product), productId.toString());

const customData = meta.productCustomData([product], [{ productId: productId.toString(), quantity: 2 }]);
assert.deepEqual(customData.content_ids, [productId.toString()]);
assert.equal(customData.value, 1800);
assert.equal(customData.num_items, 2);
assert.deepEqual(customData.contents, [{ id: productId.toString(), quantity: 2, item_price: 900 }]);

const order: Order = {
  _id: new ObjectId(),
  userId: new ObjectId(),
  customerName: 'Buyer',
  phone: '01771969188',
  address: 'Dhaka address',
  deliveryArea: 'inside_dhaka',
  deliveryCharge: 70,
  subtotalAmount: 1800,
  items: [{ productId, name: product.name, slug: product.slug, image: product.images[0].url, price: 900, quantity: 2 }],
  totalAmount: 1870,
  paymentMethod: 'cash_on_delivery',
  orderStatus: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const orderData = meta.orderCustomData(order);
assert.deepEqual(orderData.content_ids, [productId.toString()]);
assert.equal(orderData.value, 1870);
assert.equal(orderData.order_id, order._id!.toString());
assert.equal(`Purchase:${order._id!.toString()}`, `Purchase:${order._id!.toString()}`);

assert.equal(meta.normalizeEmail(' Test@Example.COM '), 'test@example.com');
assert.equal(meta.normalizePhone('+880 1771-969188'), '8801771969188');
assert.equal(meta.sha256(undefined), undefined);
assert.match(meta.sha256('test@example.com')!, /^[a-f0-9]{64}$/);

const userData = meta.hashedUserData({ email: ' Test@Example.COM ', phone: '01771969188', fbp: 'fbp-cookie', fbc: 'fbc-cookie' });
assert.match(userData.em, /^[a-f0-9]{64}$/);
assert.match(userData.ph, /^[a-f0-9]{64}$/);
assert.equal(userData.fbp, 'fbp-cookie');
assert.equal(userData.fbc, 'fbc-cookie');
assert.equal('empty' in userData, false);

const { xml, stats } = catalog.buildCatalogFeed([product], 'https://bornilvibes.com');
assert.equal(stats.total, 1);
assert.equal(stats.eligible, 1);
assert.equal(stats.excluded, 0);
assert.match(xml, new RegExp(`<g:id>${productId.toString()}</g:id>`));
assert.match(xml, /<g:price>1200\.00 BDT<\/g:price>/);
assert.match(xml, /<g:sale_price>900\.00 BDT<\/g:sale_price>/);
assert.match(xml, /<g:availability>in stock<\/g:availability>/);
assert.match(xml, /https:\/\/bornilvibes\.com\/products\//);
assert.match(xml, /Gold &amp; Pearl &lt;Set&gt;/);

const invalid = { ...product, _id: new ObjectId(), images: [], price: 0 };
const invalidResult = catalog.buildCatalogFeed([invalid], 'https://bornilvibes.com');
assert.equal(invalidResult.stats.eligible, 0);
assert.equal(invalidResult.stats.excluded, 1);
assert.equal(invalidResult.stats.missingImages, 1);
assert.equal(invalidResult.stats.missingValidPrices, 1);

console.log('Meta mapping and catalog tests passed');
