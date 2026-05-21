import { adminPhones } from './config/env';
import { closeDB, connectDB } from './db/connectDB';
import type { User } from './types';

async function migrateAdmins() {
  const db = await connectDB();
  const result = await db.collection<User>('users').updateMany(
    { phone: { $in: adminPhones } },
    {
      $set: {
        role: 'admin',
        status: 'active',
        updatedAt: new Date(),
      },
    },
  );

  await closeDB();
  console.log(`Updated ${result.modifiedCount} admin users for phones: ${adminPhones.join(', ')}`);
}

migrateAdmins().catch(async (error) => {
  console.error(error);
  await closeDB();
  process.exit(1);
});
