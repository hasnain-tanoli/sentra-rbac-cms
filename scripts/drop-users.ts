import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, "..", ".env.local");
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in environment variables");
  console.error("Looking for .env.local at:", envPath);
  process.exit(1);
}

async function dropUsersCollection() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length > 0) {
      await db.dropCollection('users');
      console.log("✅ Users collection dropped successfully");
    } else {
      console.log("ℹ️ Users collection does not exist");
    }

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error dropping users collection:", error);
    process.exit(1);
  }
}

dropUsersCollection();