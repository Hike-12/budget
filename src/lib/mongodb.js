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

  // One-time migration: remove explicit clientId:null stored by old schema default.
  // The sparse unique index only ignores *absent* fields, not null fields —
  // so documents with clientId:null were colliding with each other on add.
  if (!cached.migrated) {
    cached.migrated = true;
    try {
      const db = cached.conn.connection.db;
      await db
        .collection("idempotencyKeys")
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      const result = await db
        .collection("budgets")
        .updateMany(
          { clientId: { $type: "null" } },
          { $unset: { clientId: "" } },
        );
      if (result.modifiedCount > 0) {
        console.log(
          `[Migration] Cleaned up ${result.modifiedCount} legacy clientId:null entries.`,
        );
      }
    } catch (_) {
      // non-fatal — best effort cleanup
    }
  }

  return cached.conn;
}
