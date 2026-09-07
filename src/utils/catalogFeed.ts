import type { Product } from '../types';
import { metaProductId } from './meta';

const BRAND = 'Bornil Vibes';
const CURRENCY = 'BDT';

export type CatalogFeedStats = {
  total: number;
  eligible: number;
  excluded: number;
  duplicateIds: string[];
  missingImages: number;
  missingValidPrices: number;
  missingPublicUrls: number;
  invalidStockState: number;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function firstClientUrl(clientUrl: string) {
  return clientUrl.split(',')[0]?.trim().replace(/\/$/, '') || 'https://bornilvibes.com';
}

function absoluteHttpsUrl(url: string | undefined, siteBase: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, siteBase);
    return parsed.protocol === 'https:' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function productUrl(product: Product, siteBase: string) {
  return `${siteBase}/products/${metaProductId(product)}`;
}

export function catalogAvailability(product: Product) {
  return product.stock > 0 ? 'in stock' : 'out of stock';
}

export function buildCatalogFeed(products: Product[], clientUrl: string) {
  const siteBase = firstClientUrl(clientUrl);
  const seenIds = new Set<string>();
  const stats: CatalogFeedStats = {
    total: products.length,
    eligible: 0,
    excluded: 0,
    duplicateIds: [],
    missingImages: 0,
    missingValidPrices: 0,
    missingPublicUrls: 0,
    invalidStockState: 0,
  };

  const items = products.flatMap((product) => {
    const id = metaProductId(product);
    const image = absoluteHttpsUrl(product.images[0]?.url, siteBase);
    const link = absoluteHttpsUrl(productUrl(product, siteBase), siteBase);
    const validPrice = Number.isFinite(product.price) && product.price > 0;
    const validStock = Number.isInteger(product.stock) && product.stock >= 0;

    if (seenIds.has(id)) stats.duplicateIds.push(id);
    seenIds.add(id);
    if (!image) stats.missingImages += 1;
    if (!validPrice) stats.missingValidPrices += 1;
    if (!link) stats.missingPublicUrls += 1;
    if (!validStock) stats.invalidStockState += 1;

    const eligible = product.status === 'active' && product.name && product.description && image && link && validPrice && validStock && !stats.duplicateIds.includes(id);
    if (!eligible) {
      stats.excluded += 1;
      return [];
    }

    stats.eligible += 1;
    const salePrice = product.oldPrice && product.oldPrice > product.price ? `    <g:sale_price>${product.price.toFixed(2)} ${CURRENCY}</g:sale_price>\n` : '';
    const regularPrice = product.oldPrice && product.oldPrice > product.price ? product.oldPrice : product.price;

    return `  <item>\n    <g:id>${escapeXml(id)}</g:id>\n    <g:title>${escapeXml(product.name)}</g:title>\n    <g:description>${escapeXml(product.description)}</g:description>\n    <g:availability>${catalogAvailability(product)}</g:availability>\n    <g:condition>new</g:condition>\n    <g:price>${regularPrice.toFixed(2)} ${CURRENCY}</g:price>\n${salePrice}    <g:link>${escapeXml(link)}</g:link>\n    <g:image_link>${escapeXml(image)}</g:image_link>\n    <g:brand>${BRAND}</g:brand>\n  </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n  <title>Bornil Vibes Product Catalog</title>\n  <link>${escapeXml(siteBase)}</link>\n  <description>Bornil Vibes storefront product feed for Meta Commerce Manager.</description>\n${items.join('\n')}\n</channel>\n</rss>\n`;

  return { xml, stats };
}
