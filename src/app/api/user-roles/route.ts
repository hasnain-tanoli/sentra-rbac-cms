import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { UserRole } from "@/lib/db/models/userRole.model";
import { User } from "@/lib/db/models/user.model";
import { Role } from "@/lib/db/models/role.model";

// ✅ Assign a role to a user
export async function POST(req: Request) {
    try {
        await connectDB();
        const { user_id, role_id } = await req.json();

        if (!user_id || !role_id) {
            return NextResponse.json(
                { success: false, message: "user_id and role_id are required." },
                { status: 400 }
            );
        }

        // Check if user and role exist
        const [user, role] = await Promise.all([
            User.findById(user_id),
            Role.findById(role_id),
        ]);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found." },
                { status: 404 }
            );
        }

        if (!role) {
            return NextResponse.json(
                { success: false, message: "Role not found." },
                { status: 404 }
            );
        }

        // Prevent duplicate assignments
        const existingAssignment = await UserRole.findOne({ user_id, role_id });
        if (existingAssignment) {
            return NextResponse.json(
                { success: false, message: "This user already has that role." },
                { status: 409 }
            );
        }

        // Create new assignment
        const userRole = await UserRole.create({ user_id, role_id });

        return NextResponse.json(
            {
                success: true,
                message: "Role assigned to user successfully.",
                data: userRole,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/user-roles error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to assign role." },
            { status: 500 }
        );
    }
}

// ✅ Get all user-role assignments
export async function GET() {
    try {
        await connectDB();

        const assignments = await UserRole.find()
            .populate("user_id", "name email")
            .populate("role_id", "title description")
            .sort({ assignedAt: -1 });

        return NextResponse.json(
            { success: true, data: assignments },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/user-roles error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch user-role assignments." },
            { status: 500 }
        );
    }
}
