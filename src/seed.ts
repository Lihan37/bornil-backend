import { connectDB, closeDB } from './db/connectDB';
import type { Category, Product } from './types';
import { slugify } from './utils/slugify';

const categoryNames = ['Earrings', 'Necklaces', 'Rings', 'Bracelets', 'Bangles', 'Anklets', 'Hair Accessories', 'Bridal Jewelry'];

const sampleProducts = [
  {
    name: 'Aurelia Pearl Drop Earrings',
    category: 'Earrings',
    price: 1850,
    oldPrice: 2200,
    description: 'Freshwater-inspired pearl drops with rose-gold plated floral studs.',
    material: 'Rose-gold plated brass',
    color: 'Pearl white',
    size: '4.2 cm',
    stock: 18,
    isFeatured: true,
    isBestSelling: true,
  },
  {
    name: 'Noor Layered Necklace',
    category: 'Necklaces',
    price: 2450,
    description: 'A delicate double-layer necklace with soft gold finish and crystal charms.',
    material: '18k gold plated stainless steel',
    color: 'Soft gold',
    size: '16-20 inch adjustable',
    stock: 11,
    isFeatured: true,
    isBestSelling: true,
  },
  {
    name: 'Zarina Bridal Choker Set',
    category: 'Bridal Jewelry',
    price: 6850,
    description: 'Statement bridal choker set with kundan-style stones, earrings, and tikli.',
    material: 'Gold plated alloy',
    color: 'Antique gold',
    size: 'Adjustable',
    stock: 6,
    isFeatured: true,
    isBestSelling: false,
  },
];

async function seed() {
  const db = await connectDB();
  const now = new Date();

  await db.collection<Category>('categories').deleteMany({});
  await db.collection<Product>('products').deleteMany({});

  await db.collection<Category>('categories').insertMany(
    categoryNames.map((name, index) => ({
      name,
      slug: slugify(name),
      isFeatured: true,
      displayOrder: index + 1,
      createdAt: now,
      updatedAt: now,
    })),
  );

  await db.collection<Product>('products').insertMany(
    sampleProducts.map((product, index) => ({
      ...product,
      slug: `${slugify(product.name)}-${index + 1}`,
      images: [
        {
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          publicId: '',
        },
      ],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })),
  );

  await closeDB();
  console.log('Seed completed. Admin users are created securely by signing up with a phone from ADMIN_PHONES.');
}

seed().catch(async (error) => {
  console.error(error);
  await closeDB();
  process.exit(1);
});
