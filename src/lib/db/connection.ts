import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("❌ Missing MONGODB_URI in environment variables");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use a global cache so it persists across hot reloads
let cached = (global as any).mongoose as MongooseCache;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "sentra",
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("🟢 Connected to MongoDB");
  } catch (error) {
    console.error("🔴 MongoDB connection error:", error);
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
