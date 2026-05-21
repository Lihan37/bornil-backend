import { closeDB, connectDB } from './db/connectDB';

async function migrateEmailIndex() {
  const db = await connectDB();
  const users = db.collection('users');

  await users.updateMany(
    {
      $or: [{ email: null }, { email: '' }],
    },
    {
      $unset: { email: '' },
      $set: { updatedAt: new Date() },
    },
  );

  const indexes = await users.indexes();
  for (const index of indexes) {
    if (index.key?.email === 1 && index.name && index.name !== '_id_') {
      await users.dropIndex(index.name);
    }
  }

  await users.createIndex(
    { email: 1 },
    {
      unique: true,
      partialFilterExpression: {
        email: { $type: 'string' },
      },
    },
  );

  await closeDB();
  console.log('Email cleanup and partial unique email index migration completed.');
}

migrateEmailIndex().catch(async (error) => {
  console.error(error);
  await closeDB();
  process.exit(1);
});
