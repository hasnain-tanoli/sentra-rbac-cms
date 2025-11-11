import dotenv from 'dotenv';

// Load both .env and .env.local
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

console.log("Checking environment variables...");
console.log("MONGODB_URI exists:", !!MONGODB_URI);

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  console.log("Make sure you have MONGODB_URI in your .env or .env.local file");
  process.exit(1);
}

const SYSTEM_RESOURCES = ['users', 'roles', 'permissions', 'dashboard'];

async function run() {
  try {
    console.log("🔄 Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to database");

    const Permission = mongoose.model('Permission', new mongoose.Schema({
      resource: String,
      action: String,
      key: String,
      description: String,
      is_system: Boolean
    }));

    console.log("\n🔄 Updating system permissions...");
    const result = await Permission.updateMany(
      { resource: { $in: SYSTEM_RESOURCES } },
      { $set: { is_system: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} permissions as system permissions`);

    console.log("\n🔄 Updating non-system permissions...");
    const nonSystemResult = await Permission.updateMany(
      { resource: { $nin: SYSTEM_RESOURCES } },
      { $set: { is_system: false } }
    );

    console.log(`✅ Updated ${nonSystemResult.modifiedCount} permissions as non-system permissions`);

    console.log("\n📊 Summary:");
    const systemPerms = await Permission.countDocuments({ is_system: true });
    const nonSystemPerms = await Permission.countDocuments({ is_system: false });
    console.log(`   - System permissions: ${systemPerms}`);
    console.log(`   - Non-system permissions: ${nonSystemPerms}`);

    await mongoose.connection.close();
    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

run();
