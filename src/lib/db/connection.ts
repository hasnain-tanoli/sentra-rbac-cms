import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("❌ Missing MONGODB_URI in environment variables");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}
declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
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
