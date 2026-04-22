import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in .env.local");

let cached = global.mongoose;
if (!cached)
  cached = global.mongoose = { conn: null, promise: null, migrated: false };

export async function connectToDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => m);
  }
  cached.conn = await cached.promise;

  // Ensure production-ready indexes for idempotency
  try {
    const db = cached.conn.connection.db;
    const idempotencyCollection = db.collection("idempotencyKeys");

    // Migrate away from legacy unique key index that can fail on documents
    // missing the `key` field (duplicate null values).
    const indexes = await idempotencyCollection.indexes();
    if (indexes.some((idx) => idx.name === "key_1")) {
      await idempotencyCollection.dropIndex("key_1");
    }

    // TTL index for auto-expiry
    await idempotencyCollection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    );
  } catch (err) {
    console.warn("Index ensuring failed (likely already exists):", err.message);
  }

  return cached.conn;
}
