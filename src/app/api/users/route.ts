import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user.model";
import { UserRole } from "@/lib/db/models/userRole.model";
import { Role } from "@/lib/db/models/role.model";
import { hasPermission } from "@/lib/rbac/checkPermission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
}

export interface UserWithRelations {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    is_active: boolean;
    is_system?: boolean;
    roles: {
        _id: string;
        title: string;
        key: string;
        description?: string;
        is_system?: boolean;
    }[];
    permissions: {
        _id: string;
        resource: string;
        action: string;
        key: string;
        description?: string;
    }[];
    created_at: Date;
    updated_at: Date;
}

function respond<T>(
    success: boolean,
    message: string,
    status: number,
    data?: T
): NextResponse<ApiResponse<T>> {
    const payload: ApiResponse<T> = { success, message };
    if (data !== undefined) payload.data = data;
    return NextResponse.json(payload, { status });
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return respond(false, "Unauthorized. Please log in.", 401);
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const email = searchParams.get("email");

        const requestedEmail = email?.toLowerCase();
        const requestedId = id;
        const isOwnProfile =
            (requestedId && session.user.id === requestedId) ||
            (requestedEmail && session.user.email?.toLowerCase() === requestedEmail);

        if ((id || email) && !isOwnProfile) {
            const canRead = await hasPermission(session.user.id, 'users', 'read');
            if (!canRead) {
                return respond(false, "Forbidden. You don't have permission to view other users.", 403);
            }
        }

        if (!id && !email) {
            const canRead = await hasPermission(session.user.id, 'users', 'read');
            if (!canRead) {
                return respond(false, "Forbidden. You don't have permission to list users.", 403);
            }
        }

        const matchStage =
            id && mongoose.Types.ObjectId.isValid(id)
                ? { _id: new mongoose.Types.ObjectId(id) }
                : email
                    ? { email: email.toLowerCase() }
                    : {};

        const pipeline: mongoose.PipelineStage[] = [
            { $match: matchStage },

            {
                $lookup: {
                    from: "userroles",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "userRoles",
                },
            },

            {
                $lookup: {
                    from: "roles",
                    localField: "userRoles.role_id",
                    foreignField: "_id",
                    as: "roles",
                },
            },

            {
                $lookup: {
                    from: "rolepermissions",
                    localField: "roles._id",
                    foreignField: "role_id",
                    as: "rolePermissions",
                },
            },

            {
                $lookup: {
                    from: "permissions",
                    localField: "rolePermissions.permission_id",
                    foreignField: "_id",
                    as: "permissions",
                },
            },

            {
                $addFields: {
                    permissions: {
                        $reduce: {
                            input: "$permissions",
                            initialValue: [],
                            in: {
                                $cond: [
                                    {
                                        $in: [
                                            "$$this._id",
                                            {
                                                $map: {
                                                    input: "$$value",
                                                    as: "existing",
                                                    in: "$$existing._id"
                                                }
                                            }
                                        ]
                                    },
                                    "$$value",
                                    {
                                        $concatArrays: ["$$value", ["$$this"]]
                                    }
                                ]
                            }
                        }
                    }
                }
            },

            {
                $addFields: {
                    _id: { $toString: "$_id" },

                    roles: {
                        $map: {
                            input: "$roles",
                            as: "role",
                            in: {
                                _id: { $toString: "$$role._id" },
                                title: "$$role.title",
                                key: "$$role.key",
                                description: "$$role.description",
                                is_system: "$$role.is_system"
                            }
                        }
                    },

                    permissions: {
                        $map: {
                            input: "$permissions",
                            as: "perm",
                            in: {
                                _id: { $toString: "$$perm._id" },
                                resource: "$$perm.resource",
                                action: "$$perm.action",
                                key: "$$perm.key",
                                description: "$$perm.description"
                            }
                        }
                    }
                }
            },

            {
                $project: {
                    password: 0,
                    userRoles: 0,
                    rolePermissions: 0,
                    __v: 0,
                },
            },
        ];

        const users = await User.aggregate<UserWithRelations>(pipeline);

        if (id || email) {
            if (!users.length) return respond(false, "User not found.", 404);
            return respond(true, "User fetched successfully.", 200, users[0]);
        }

        return respond(true, "Users fetched successfully.", 200, users);
    } catch (error) {
        console.error("GET /api/users error:", error);
        return respond(false, "Failed to fetch users.", 500);
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();

        const { name, email, password, role_ids } = await req.json();

        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return respond(false, "Name, email, and password are required.", 400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return respond(false, "Invalid email address.", 400);
        }

        const normalizedEmail = email.trim().toLowerCase();

        const SUPER_ADMIN_EMAIL = "superadmin@sentra.com";
        const isSuperAdminCreation = normalizedEmail === SUPER_ADMIN_EMAIL;

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return respond(false, "User with this email already exists.", 409);
        }

        const hashedPassword = await bcrypt.hash(password.trim(), 10);

        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            is_system: isSuperAdminCreation,
        });

        console.log(`✅ User created: ${newUser.email}`);

        if (isSuperAdminCreation) {
            const superAdminRole = await Role.findOne({ key: "super_admin" });
            if (superAdminRole) {
                await UserRole.create({
                    user_id: newUser._id,
                    role_id: superAdminRole._id,
                });
                console.log(`✅ Assigned 'super-admin' role to system user ${newUser.email}`);
            } else {
                console.warn(`⚠️ CRITICAL: 'super-admin' role not found. System user ${newUser.email} created without essential permissions.`);
            }
        } else {
            if (Array.isArray(role_ids) && role_ids.length > 0) {
                const validRoleIds = role_ids.filter(id => mongoose.Types.ObjectId.isValid(id));

                if (validRoleIds.length > 0) {
                    const roleAssignments = validRoleIds.map(roleId => ({
                        user_id: newUser._id,
                        role_id: roleId
                    }));
                    await UserRole.insertMany(roleAssignments);
                    console.log(`✅ Assigned ${validRoleIds.length} role(s) to ${newUser.email}`);
                }
            } else {
                const defaultRole = await Role.findOne({ key: "author" });
                if (defaultRole) {
                    await UserRole.create({
                        user_id: newUser._id,
                        role_id: defaultRole._id,
                    });
                    console.log(`✅ Assigned default role "${defaultRole.title}" to ${newUser.email}`);
                } else {
                    console.warn("⚠️ No default 'author' role found. User created without roles.");
                }
            }
        }

        const pipeline: mongoose.PipelineStage[] = [
            { $match: { _id: newUser._id } },

            {
                $lookup: {
                    from: "userroles",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "userRoles",
                },
            },

            {
                $lookup: {
                    from: "roles",
                    localField: "userRoles.role_id",
                    foreignField: "_id",
                    as: "roles",
                },
            },

            {
                $lookup: {
                    from: "rolepermissions",
                    localField: "roles._id",
                    foreignField: "role_id",
                    as: "rolePermissions",
                },
            },

            {
                $lookup: {
                    from: "permissions",
                    localField: "rolePermissions.permission_id",
                    foreignField: "_id",
                    as: "permissions",
                },
            },

            {
                $addFields: {
                    permissions: {
                        $reduce: {
                            input: "$permissions",
                            initialValue: [],
                            in: {
                                $cond: [
                                    {
                                        $in: [
                                            "$$this._id",
                                            {
                                                $map: {
                                                    input: "$$value",
                                                    as: "existing",
                                                    in: "$$existing._id"
                                                }
                                            }
                                        ]
                                    },
                                    "$$value",
                                    {
                                        $concatArrays: ["$$value", ["$$this"]]
                                    }
                                ]
                            }
                        }
                    }
                }
            },

            {
                $addFields: {
                    _id: { $toString: "$_id" },

                    roles: {
                        $map: {
                            input: "$roles",
                            as: "role",
                            in: {
                                _id: { $toString: "$$role._id" },
                                title: "$$role.title",
                                key: "$$role.key",
                                description: "$$role.description",
                                is_system: "$$role.is_system"
                            }
                        }
                    },

                    permissions: {
                        $map: {
                            input: "$permissions",
                            as: "perm",
                            in: {
                                _id: { $toString: "$$perm._id" },
                                resource: "$$perm.resource",
                                action: "$$perm.action",
                                key: "$$perm.key",
                                description: "$$perm.description"
                            }
                        }
                    }
                }
            },

            {
                $project: {
                    password: 0,
                    userRoles: 0,
                    rolePermissions: 0,
                    __v: 0,
                },
            },
        ];

        const [userWithRelations] = await User.aggregate<UserWithRelations>(pipeline);

        return respond(
            true,
            "User created successfully.",
            201,
            userWithRelations
        );
    } catch (error) {
        console.error("POST /api/users error:", error);
        return respond(false, "Failed to create user.", 500);
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return respond(false, "Unauthorized. Please log in.", 401);
        }

        await connectDB();

        const { id, name, email, role_keys } = await req.json();

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return respond(false, "Invalid user ID.", 400);
        }

        const isSelf = session.user.id === id;
        const canUpdate = await hasPermission(session.user.id, 'users', 'update');

        if (!isSelf && !canUpdate) {
            return respond(false, "Forbidden.", 403);
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return respond(false, "User not found.", 404);
        }

        const SUPER_ADMIN_EMAIL = "superadmin@sentra.com";
        const newEmail = email?.trim().toLowerCase();

        if (newEmail === SUPER_ADMIN_EMAIL && targetUser.email !== SUPER_ADMIN_EMAIL) {
            return respond(false, "This email address is reserved for the system admin account.", 403);
        }

        if (targetUser.email === SUPER_ADMIN_EMAIL && newEmail && newEmail !== SUPER_ADMIN_EMAIL) {
            return respond(false, "The email of the primary super admin account cannot be changed.", 403);
        }

        if (targetUser.is_system && !isSelf) {
            console.warn(`⚠️ Updating system user: ${targetUser.email} by ${session.user.email}`);
        }

        const updateData: Record<string, string> = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.trim().toLowerCase();

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedUser) return respond(false, "User not found.", 404);

        if (Array.isArray(role_keys) && canUpdate) {
            if (updatedUser.email === SUPER_ADMIN_EMAIL && !role_keys.includes('super_admin')) {
                return respond(false, "The 'super-admin' role cannot be removed", 403);
            }

            const { assignRolesToUser } = await import("@/lib/rbac/assignRoles");
            await UserRole.deleteMany({ user_id: id });
            if (role_keys.length > 0) {
                await assignRolesToUser(id, role_keys);
            }
        }

        const pipeline: mongoose.PipelineStage[] = [
            { $match: { _id: new mongoose.Types.ObjectId(id) } },

            {
                $lookup: {
                    from: "userroles",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "userRoles",
                },
            },

            {
                $lookup: {
                    from: "roles",
                    localField: "userRoles.role_id",
                    foreignField: "_id",
                    as: "roles",
                },
            },

            {
                $lookup: {
                    from: "rolepermissions",
                    localField: "roles._id",
                    foreignField: "role_id",
                    as: "rolePermissions",
                },
            },

            {
                $lookup: {
                    from: "permissions",
                    localField: "rolePermissions.permission_id",
                    foreignField: "_id",
                    as: "permissions",
                },
            },

            {
                $addFields: {
                    permissions: {
                        $reduce: {
                            input: "$permissions",
                            initialValue: [],
                            in: {
                                $cond: [
                                    {
                                        $in: [
                                            "$$this._id",
                                            {
                                                $map: {
                                                    input: "$$value",
                                                    as: "existing",
                                                    in: "$$existing._id"
                                                }
                                            }
                                        ]
                                    },
                                    "$$value",
                                    {
                                        $concatArrays: ["$$value", ["$$this"]]
                                    }
                                ]
                            }
                        }
                    }
                }
            },

            {
                $addFields: {
                    _id: { $toString: "$_id" },

                    roles: {
                        $map: {
                            input: "$roles",
                            as: "role",
                            in: {
                                _id: { $toString: "$$role._id" },
                                title: "$$role.title",
                                key: "$$role.key",
                                description: "$$role.description",
                                is_system: "$$role.is_system"
                            }
                        }
                    },

                    permissions: {
                        $map: {
                            input: "$permissions",
                            as: "perm",
                            in: {
                                _id: { $toString: "$$perm._id" },
                                resource: "$$perm.resource",
                                action: "$$perm.action",
                                key: "$$perm.key",
                                description: "$$perm.description"
                            }
                        }
                    }
                }
            },

            {
                $project: {
                    password: 0,
                    userRoles: 0,
                    rolePermissions: 0,
                    __v: 0,
                },
            },
        ];

        const [userWithRelations] = await User.aggregate<UserWithRelations>(pipeline);

        return respond(true, "User updated successfully.", 200, userWithRelations);
    } catch (error) {
        console.error("PUT /api/users error:", error);
        return respond(false, "Failed to update user.", 500);
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return respond(false, "Unauthorized. Please log in.", 401);
        }

        const canDelete = await hasPermission(session.user.id, 'users', 'delete');
        if (!canDelete) {
            return respond(false, "Forbidden.", 403);
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return respond(false, "Invalid or missing user ID.", 400);
        }

        if (session.user.id === id) {
            return respond(false, "You cannot delete your own account.", 400);
        }

        const user = await User.findById(id);
        if (!user) return respond(false, "User not found.", 404);

        if (user.is_system) {
            return respond(
                false,
                "System users cannot be deleted. This user is required for core functionality.",
                403
            );
        }

        await UserRole.deleteMany({ user_id: id });
        await User.findByIdAndDelete(id);

        return respond(true, `User ${user.email} deleted successfully.`, 200);
    } catch (error) {
        console.error("DELETE /api/users error:", error);
        return respond(false, "Failed to delete user.", 500);
    }
}