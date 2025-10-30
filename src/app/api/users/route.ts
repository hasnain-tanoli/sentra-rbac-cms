import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";

export async function GET() {
    try {
        await connectDB();

        const users = await User.aggregate([
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
                $project: {
                    password: 0,
                    userRoles: 0,
                    rolePermissions: 0,
                    "roles.__v": 0,
                    "permissions.__v": 0,
                },
            },
        ]);

        return NextResponse.json({ success: true, data: users }, { status: 200 });
    } catch (error) {
        console.error("GET /api/users error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

// ✅ POST: Create new user
export async function POST(req: Request) {
    try {
        await connectDB();
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, message: "Name, email, and password are required." },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Email already exists." },
                { status: 409 }
            );
        }

        const user = await User.create({ name, email, password });

        return NextResponse.json({ success: true, data: user }, { status: 201 });
    } catch (error) {
        console.error("POST /api/users error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create user." },
            { status: 500 }
        );
    }
}
