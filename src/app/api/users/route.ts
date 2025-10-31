import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";
import {
    User,
    UserRole,
} from "@/lib/db/models";

// ───────────────────────────────
// Shared Response Type
// ───────────────────────────────
interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
}

// ───────────────────────────────
// Embedded user type with relations
// ───────────────────────────────
export interface UserWithRelations {
    _id: string;
    name: string;
    email: string;
    roles: {
        _id: string;
        title: string;
        description?: string;
    }[];
    permissions: {
        _id: string;
        resource: string;
        actions: string[];
        description?: string;
    }[];
}

// ───────────────────────────────
// Utility → Standardized API response
// ───────────────────────────────
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

// ───────────────────────────────
// GET → Fetch all users or one by id/email
// ───────────────────────────────
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const email = searchParams.get("email");

        const matchStage =
            id && mongoose.Types.ObjectId.isValid(id)
                ? { _id: new mongoose.Types.ObjectId(id) }
                : email
                    ? { email }
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
                    _id: { $toString: "$_id" },
                    "roles._id": {
                        $map: { input: "$roles", as: "r", in: { $toString: "$$r._id" } },
                    },
                    "permissions._id": {
                        $map: { input: "$permissions", as: "p", in: { $toString: "$$p._id" } },
                    },
                },
            },
            {
                $project: {
                    password: 0,
                    userRoles: 0,
                    rolePermissions: 0,
                    "roles.__v": 0,
                    "permissions.__v": 0,
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

// ───────────────────────────────
// POST → Create user (optional)
// ───────────────────────────────
export async function POST(req: Request) {
    try {
        await connectDB();
        const { name, email }: { name: string; email: string } = await req.json();

        if (!name?.trim() || !email?.trim()) {
            return respond(false, "Name and email are required.", 400);
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return respond(false, "User with this email already exists.", 400);
        }

        const newUser = await User.create({ name: name.trim(), email: email.trim() });
        return respond(true, "User created successfully.", 201, newUser);
    } catch (error) {
        console.error("POST /api/users error:", error);
        return respond(false, "Failed to create user.", 500);
    }
}

// ───────────────────────────────
// PUT → Update user and roles
// ───────────────────────────────
export async function PUT(req: Request) {
    try {
        await connectDB();
        const { id, name, email, roleIds }: {
            id: string;
            name: string;
            email: string;
            roleIds?: string[];
        } = await req.json();

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return respond(false, "Invalid user ID.", 400);
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { name: name.trim(), email: email.trim() },
            { new: true }
        );
        if (!updatedUser) return respond(false, "User not found.", 404);

        if (Array.isArray(roleIds)) {
            await UserRole.deleteMany({ user_id: id });
            const validRoleIds = roleIds.filter((r) => mongoose.Types.ObjectId.isValid(r));
            if (validRoleIds.length > 0) {
                const docs = validRoleIds.map((roleId) => ({
                    user_id: new mongoose.Types.ObjectId(id),
                    role_id: new mongoose.Types.ObjectId(roleId),
                }));
                await UserRole.insertMany(docs);
            }
        }

        // Re-fetch with relations
        const [userWithRelations] = await User.aggregate<UserWithRelations>([
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
                    _id: { $toString: "$_id" },
                    "roles._id": {
                        $map: { input: "$roles", as: "r", in: { $toString: "$$r._id" } },
                    },
                    "permissions._id": {
                        $map: { input: "$permissions", as: "p", in: { $toString: "$$p._id" } },
                    },
                },
            },
            {
                $project: {
                    password: 0,
                    userRoles: 0,
                    rolePermissions: 0,
                    "roles.__v": 0,
                    "permissions.__v": 0,
                },
            },
        ]);

        return respond(true, "User updated successfully.", 200, userWithRelations);
    } catch (error) {
        console.error("PUT /api/users error:", error);
        return respond(false, "Failed to update user.", 500);
    }
}

// ───────────────────────────────
// DELETE → Remove user & role refs
// ───────────────────────────────
export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return respond(false, "Invalid or missing user ID.", 400);
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
