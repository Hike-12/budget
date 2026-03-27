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
    // TTL index for auto-expiry
    await db
      .collection("idempotencyKeys")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    // UNIQUE index for the key itself (The actual shield)
    await db
      .collection("idempotencyKeys")
      .createIndex({ key: 1 }, { unique: true });
  } catch (err) {
    console.warn("Index ensuring failed (likely already exists):", err.message);
  }

  return cached.conn;
}
