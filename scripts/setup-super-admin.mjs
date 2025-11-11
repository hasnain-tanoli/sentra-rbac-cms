import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found");
  process.exit(1);
}

async function setupSuperAdmin() {
  try {
    console.log("🔄 Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to database");

    // Define models
    const Role = mongoose.model(
      "Role",
      new mongoose.Schema({
        title: String,
        key: String,
        description: String,
        is_system: Boolean,
      })
    );

    const Permission = mongoose.model(
      "Permission",
      new mongoose.Schema({
        resource: String,
        action: String,
        key: String,
        description: String,
        is_system: Boolean,
      })
    );

    const RolePermission = mongoose.model(
      "RolePermission",
      new mongoose.Schema({
        role_id: mongoose.Schema.Types.ObjectId,
        permission_id: mongoose.Schema.Types.ObjectId,
      })
    );

    // Step 1: Find or create super admin role
    console.log("\n🔄 Setting up super admin role...");
    let superAdminRole = await Role.findOne({ key: "super_admin" });

    if (!superAdminRole) {
      console.log("Super admin role not found. Creating...");
      superAdminRole = await Role.create({
        title: "Super Admin",
        key: "super_admin",
        description: "System administrator with full access to all features",
        is_system: true,
      });
      console.log("✅ Super admin role created");
    } else {
      // Update existing role to be system role
      console.log("Super admin role found. Updating...");
      superAdminRole.is_system = true;
      superAdminRole.description =
        superAdminRole.description ||
        "System administrator with full access to all features";
      await superAdminRole.save();
      console.log("✅ Super admin role updated to system role");
    }

    // Step 2: Get all permissions
    console.log("\n🔄 Fetching all permissions...");
    const allPermissions = await Permission.find();
    console.log(`✅ Found ${allPermissions.length} permissions`);

    // Step 3: Assign all permissions to super admin
    console.log("\n🔄 Assigning permissions to super admin...");
    let assignedCount = 0;
    let skippedCount = 0;

    for (const permission of allPermissions) {
      const existing = await RolePermission.findOne({
        role_id: superAdminRole._id,
        permission_id: permission._id,
      });

      if (!existing) {
        await RolePermission.create({
          role_id: superAdminRole._id,
          permission_id: permission._id,
        });
        assignedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ Assigned ${assignedCount} new permissions`);
    console.log(`ℹ️  Skipped ${skippedCount} already assigned permissions`);

    // Step 4: Summary
    console.log("\n📊 Summary:");
    const totalAssignments = await RolePermission.countDocuments({
      role_id: superAdminRole._id,
    });
    console.log(`   - Super Admin Role ID: ${superAdminRole._id}`);
    console.log(`   - Total Permissions: ${allPermissions.length}`);
    console.log(`   - Assigned to Super Admin: ${totalAssignments}`);

    await mongoose.connection.close();
    console.log("\n✅ Super admin setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error)
    );
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

setupSuperAdmin();
