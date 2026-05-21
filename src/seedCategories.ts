import { connectDB, closeDB } from './db/connectDB';
import type { Category } from './types';
import { slugify } from './utils/slugify';

const defaultCategories = ['Earrings', 'Necklaces', 'Rings', 'Bracelets', 'Bangles', 'Anklets', 'Hair Accessories', 'Bridal Jewelry'];

async function seedCategories() {
  const db = await connectDB();
  const now = new Date();

  for (const [index, name] of defaultCategories.entries()) {
    await db.collection<Category>('categories').updateOne(
      { slug: slugify(name) },
      {
        $set: {
          name,
          slug: slugify(name),
          isFeatured: true,
          displayOrder: index + 1,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }

  await closeDB();
  console.log(`Seeded ${defaultCategories.length} default categories.`);
}

seedCategories().catch(async (error) => {
  console.error(error);
  await closeDB();
  process.exit(1);
});
