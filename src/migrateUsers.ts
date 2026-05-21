import { closeDB, connectDB } from './db/connectDB';
import type { User } from './types';

async function migrateUsers() {
  const db = await connectDB();
  const result = await db.collection<User>('users').updateMany(
    { status: { $exists: false } },
    {
      $set: {
        status: 'active',
        updatedAt: new Date(),
      },
    },
  );

  await closeDB();
  console.log(`Updated ${result.modifiedCount} users with active status.`);
}

migrateUsers().catch(async (error) => {
  console.error(error);
  await closeDB();
  process.exit(1);
});
