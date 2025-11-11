import { connectDB } from "@/lib/db/connection";
import { Role } from "@/lib/db/models/role.model";
import { Permission } from "@/lib/db/models/permission.model";
import { RolePermission } from "@/lib/db/models/rolePermission.model";
import mongoose, { Types } from "mongoose";

export const SYSTEM_ROLES = [
    {
        key: "super_admin",
        title: "Super Admin",
        description: "Full system access with all permissions",
        is_system: true,
    },
    {
        key: "user",
        title: "User",
        description: "Basic user with limited permissions",
        is_system: true,
    },
];

export const DEFAULT_ROLES = [
    {
        key: "author",
        title: "Author",
        description: "Can create and manage their own content",
        is_system: false,
    },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
    super_admin: [],
    user: ["users.read"],
    author: ["users.read"],
};

export async function seedRoles() {
    const session = await mongoose.startSession();

    try {
        await connectDB();
        console.log("🌱 Starting role seeding...");

        await session.withTransaction(async () => {
            const allPermissions = await Permission.find().session(session);
            const permissionMap = new Map<string, Types.ObjectId>(
                allPermissions.map((p) => [p.key, p._id as Types.ObjectId])
            );
            const allPermissionIds = allPermissions.map((p) => p._id as Types.ObjectId);

            console.log(`📋 Loaded ${allPermissions.length} permissions`);

            async function assignPermissionsToRole(
                role: { _id: Types.ObjectId },
                permissionKeys: string[],
                isSuperAdmin: boolean = false
            ): Promise<number> {
                const permissionIds = isSuperAdmin
                    ? allPermissionIds
                    : permissionKeys
                        .map((key) => permissionMap.get(key))
                        .filter((id): id is Types.ObjectId => id !== undefined);

                if (permissionIds.length === 0) return 0;

                const existingMappings = await RolePermission.find({
                    role_id: role._id,
                    permission_id: { $in: permissionIds },
                }).session(session);

                const existingPermissionIds = new Set(
                    existingMappings.map((m) => (m.permission_id as Types.ObjectId).toString())
                );

                const missingMappings = permissionIds
                    .filter((id: Types.ObjectId) => !existingPermissionIds.has(id.toString()))
                    .map((permission_id: Types.ObjectId) => ({
                        role_id: role._id,
                        permission_id,
                    }));

                if (missingMappings.length > 0) {
                    await RolePermission.insertMany(missingMappings, {
                        session,
                        ordered: false,
                    });
                }

                return missingMappings.length;
            }

            for (const roleData of SYSTEM_ROLES) {
                const existing = await Role.findOne({ key: roleData.key }).session(
                    session
                );

                if (!existing) {
                    const [role] = await Role.create([roleData], { session });
                    console.log(`✅ Created system role: ${roleData.title}`);

                    const isSuperAdmin = roleData.key === "super_admin";
                    const permissionKeys = ROLE_PERMISSIONS[roleData.key] || [];
                    const assignedCount = await assignPermissionsToRole(
                        role,
                        permissionKeys,
                        isSuperAdmin
                    );

                    if (isSuperAdmin) {
                        console.log(
                            `✅ Assigned all ${allPermissionIds.length} permissions to ${roleData.title}`
                        );
                    } else if (assignedCount > 0) {
                        console.log(
                            `✅ Assigned ${assignedCount} permissions to ${roleData.title}`
                        );
                    }
                } else {
                    if (existing.is_system !== roleData.is_system) {
                        existing.is_system = roleData.is_system;
                        await existing.save({ session });
                        console.log(`✅ Updated system flag for: ${roleData.title}`);
                    } else {
                        console.log(`ℹ️  System role already exists: ${roleData.title}`);
                    }
                }
            }

            for (const roleData of DEFAULT_ROLES) {
                const existing = await Role.findOne({ key: roleData.key }).session(
                    session
                );

                if (!existing) {
                    const [role] = await Role.create([roleData], { session });
                    console.log(`✅ Created default role: ${roleData.title}`);

                    const permissionKeys = ROLE_PERMISSIONS[roleData.key] || [];
                    const assignedCount = await assignPermissionsToRole(
                        role,
                        permissionKeys
                    );

                    if (assignedCount > 0) {
                        console.log(
                            `✅ Assigned ${assignedCount} permissions to ${roleData.title}`
                        );
                    }
                } else {
                    console.log(`ℹ️  Default role already exists: ${roleData.title}`);
                }
            }

            console.log("✅ Role seeding completed successfully");
        });

        return { success: true, message: "Roles seeded successfully" };
    } catch (error) {
        console.error("❌ Error seeding roles:", error);
        throw error;
    } finally {
        await session.endSession();
    }
}