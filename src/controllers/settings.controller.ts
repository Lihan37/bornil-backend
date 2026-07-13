import { getDB } from '../db/connectDB';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

// Single settings document, identified by a fixed key.
const SETTINGS_KEY = 'tracking';

// Defaults preserve the site's original tracking so nothing goes dark before an
// admin saves their own IDs. Admins can override these from the dashboard.
const DEFAULTS = {
  gtmId: 'GTM-N8VZ57LJ',
  metaPixelId: '',
  ga4Id: '',
};

export const getSettings = asyncHandler(async (_req, res) => {
  const doc = await getDB().collection('settings').findOne({ key: SETTINGS_KEY });
  const settings = {
    gtmId: doc?.gtmId ?? DEFAULTS.gtmId,
    metaPixelId: doc?.metaPixelId ?? DEFAULTS.metaPixelId,
    ga4Id: doc?.ga4Id ?? DEFAULTS.ga4Id,
  };
  successResponse(res, 200, 'Settings loaded', settings);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const { gtmId, metaPixelId, ga4Id } = req.body as { gtmId: string; metaPixelId: string; ga4Id: string };
  const now = new Date();
  await getDB().collection('settings').updateOne(
    { key: SETTINGS_KEY },
    {
      $set: { gtmId, metaPixelId, ga4Id, updatedAt: now },
      $setOnInsert: { key: SETTINGS_KEY, createdAt: now },
    },
    { upsert: true },
  );
  successResponse(res, 200, 'Settings updated', { gtmId, metaPixelId, ga4Id });
});
