import { z } from 'zod';

// IDs are optional plain strings (empty string clears them). Kept permissive so
// admins can paste GTM (GTM-XXXX), Meta Pixel (numeric) or GA4 (G-XXXX) IDs.
const idField = z.string().trim().max(60).default('');

export const settingsSchema = z.object({
  gtmId: idField,
  metaPixelId: idField,
  ga4Id: idField,
});
