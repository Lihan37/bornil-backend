import type { Db, MongoClient as MongoClientType } from 'mongodb';
import { env } from '../config/env';

const { MongoClient, ServerApiVersion } = require('mongodb') as typeof import('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g9xsrko.mongodb.net/?appName=Cluster0`;

const client: MongoClientType = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: Db | null = null;

export async function connectDB() {
  if (db) return db;
  await client.connect();
  db = client.db(env.DB_NAME);
  await createIndexes(db);
  return db;
}

export function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() before using getDB().');
  }
  return db;
}

export function getClient() {
  return client;
}

export async function closeDB() {
  await client.close();
  db = null;
}

async function createIndexes(database: Db) {
  const users = database.collection('users');
  const userIndexes = await users.indexes();
  for (const index of userIndexes) {
    if (index.key?.email === 1 && index.name && index.name !== '_id_' && !index.partialFilterExpression) {
      await users.dropIndex(index.name);
    }
  }

  await Promise.all([
    users.createIndex({ phone: 1 }, { unique: true }),
    users.createIndex(
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: {
          email: { $type: 'string' },
        },
      },
    ),
    database.collection('products').createIndex({ slug: 1 }, { unique: true }),
    database.collection('products').createIndex({ category: 1, status: 1, createdAt: -1 }),
    database.collection('categories').createIndex({ slug: 1 }, { unique: true }),
    database.collection('orders').createIndex({ userId: 1, createdAt: -1 }),
    database.collection('orders').createIndex({ orderStatus: 1, createdAt: -1 }),
  ]);
}
