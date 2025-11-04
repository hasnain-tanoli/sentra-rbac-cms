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
    roles: {
        _id: string;
        title: string;
        key: string;
        description?: string;
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

        const canRead = await hasPermission(session.user.id, 'users', 'read');
        if (!canRead) {
            return respond(false, "Forbidden.", 403);
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const email = searchParams.get("email");

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

        const { name, email, password } = await req.json();

        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return respond(false, "Name, email, and password are required.", 400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return respond(false, "Invalid email address.", 400);
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return respond(false, "User with this email already exists.", 409);
        }

        const hashedPassword = await bcrypt.hash(password.trim(), 10);

        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        console.log(`✅ User created: ${newUser.email}`);

        const defaultRole = await Role.findOne({ key: "author" });

        if (defaultRole) {
            await UserRole.create({
                user_id: newUser._id,
                role_id: defaultRole._id,
            });
            console.log(`✅ Assigned role "${defaultRole.title}" to ${newUser.email}`);
        } else {
            console.warn("⚠️ No default 'author' role found. Please create it in /dashboard/roles");
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
            userWithRelations || {
                _id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
                roles: defaultRole ? [{
                    _id: defaultRole._id.toString(),
                    title: defaultRole.title,
                    key: defaultRole.key,
                    description: defaultRole.description
                }] : [],
                permissions: [],
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            }
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

        const updateData: Record<string, string> = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.trim().toLowerCase();

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedUser) return respond(false, "User not found.", 404);

        if (Array.isArray(role_keys) && canUpdate) {
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

        await UserRole.deleteMany({ user_id: id });
        await User.findByIdAndDelete(id);

        return respond(true, `User ${user.email} deleted successfully.`, 200);
    } catch (error) {
        console.error("DELETE /api/users error:", error);
        return respond(false, "Failed to delete user.", 500);
    }
}