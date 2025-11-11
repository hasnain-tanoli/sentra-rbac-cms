import { connectDB } from "@/lib/db/connection";
import { Role } from "@/lib/db/models/role.model";
import { Permission } from "@/lib/db/models/permission.model";
import { RolePermission } from "@/lib/db/models/rolePermission.model";

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

// Permissions for each role
const ROLE_PERMISSIONS: Record<string, string[]> = {
    super_admin: [], // Will get all permissions automatically
    user: [
        // Basic read permissions for users
        "users.read",
    ],
    author: [
        // Author permissions - adjust based on your needs
        "users.read",
        // Add more permissions as needed for authors
    ],
};

export async function seedRoles() {
    try {
        await connectDB();
        console.log("🌱 Starting role seeding...");

        // Seed system roles
        for (const roleData of SYSTEM_ROLES) {
            const existing = await Role.findOne({ key: roleData.key });

            if (!existing) {
                const role = await Role.create(roleData);
                console.log(`✅ Created system role: ${roleData.title}`);

                // Assign permissions to the role
                const permissionKeys = ROLE_PERMISSIONS[roleData.key] || [];

                if (roleData.key === "super_admin") {
                    // Super admin gets all permissions
                    const allPermissions = await Permission.find();
                    for (const permission of allPermissions) {
                        const existingMapping = await RolePermission.findOne({
                            role_id: role._id,
                            permission_id: permission._id,
                        });

                        if (!existingMapping) {
                            await RolePermission.create({
                                role_id: role._id,
                                permission_id: permission._id,
                            });
                        }
                    }
                    console.log(`✅ Assigned all permissions to ${roleData.title}`);
                } else if (permissionKeys.length > 0) {
                    // Assign specific permissions
                    for (const permKey of permissionKeys) {
                        const permission = await Permission.findOne({ key: permKey });
                        if (permission) {
                            const existingMapping = await RolePermission.findOne({
                                role_id: role._id,
                                permission_id: permission._id,
                            });

                            if (!existingMapping) {
                                await RolePermission.create({
                                    role_id: role._id,
                                    permission_id: permission._id,
                                });
                            }
                        }
                    }
                    console.log(`✅ Assigned ${permissionKeys.length} permissions to ${roleData.title}`);
                }
            } else {
                // Update is_system flag for existing roles
                if (existing.is_system !== roleData.is_system) {
                    existing.is_system = roleData.is_system;
                    await existing.save();
                    console.log(`✅ Updated system flag for: ${roleData.title}`);
                } else {
                    console.log(`ℹ️  System role already exists: ${roleData.title}`);
                }
            }
        }

        // Seed default non-system roles
        for (const roleData of DEFAULT_ROLES) {
            const existing = await Role.findOne({ key: roleData.key });

            if (!existing) {
                const role = await Role.create(roleData);
                console.log(`✅ Created default role: ${roleData.title}`);

                // Assign permissions to the role
                const permissionKeys = ROLE_PERMISSIONS[roleData.key] || [];

                if (permissionKeys.length > 0) {
                    for (const permKey of permissionKeys) {
                        const permission = await Permission.findOne({ key: permKey });
                        if (permission) {
                            const existingMapping = await RolePermission.findOne({
                                role_id: role._id,
                                permission_id: permission._id,
                            });

                            if (!existingMapping) {
                                await RolePermission.create({
                                    role_id: role._id,
                                    permission_id: permission._id,
                                });
                            }
                        }
                    }
                    console.log(`✅ Assigned ${permissionKeys.length} permissions to ${roleData.title}`);
                }
            } else {
                console.log(`ℹ️  Default role already exists: ${roleData.title}`);
            }
        }

        console.log("✅ Role seeding completed successfully");
        return { success: true, message: "Roles seeded successfully" };
    } catch (error) {
        console.error("❌ Error seeding roles:", error);
        throw error;
    }
}