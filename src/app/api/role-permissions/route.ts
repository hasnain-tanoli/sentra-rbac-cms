import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { RolePermission } from "@/lib/db/models/rolePermission.model";
import { Role } from "@/lib/db/models/role.model";
import { Permission } from "@/lib/db/models/permission.model";

export async function POST(req: Request) {
    try {
        await connectDB();
        const { role_id, permission_id } = await req.json();

        if (!role_id || !permission_id) {
            return NextResponse.json(
                { success: false, message: "role_id and permission_id are required." },
                { status: 400 }
            );
        }

        const [role, permission] = await Promise.all([
            Role.findById(role_id),
            Permission.findById(permission_id),
        ]);

        if (!role) {
            return NextResponse.json(
                { success: false, message: "Role not found." },
                { status: 404 }
            );
        }

        if (!permission) {
            return NextResponse.json(
                { success: false, message: "Permission not found." },
                { status: 404 }
            );
        }

        const existing = await RolePermission.findOne({ role_id, permission_id });
        if (existing) {
            return NextResponse.json(
                { success: false, message: "This permission is already assigned to the role." },
                { status: 409 }
            );
        }

        const rolePermission = await RolePermission.create({ role_id, permission_id });

        return NextResponse.json(
            {
                success: true,
                message: "Permission assigned to role successfully.",
                data: rolePermission,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/role-permissions error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to assign permission to role." },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await connectDB();

        const mappings = await RolePermission.find()
            .populate("role_id", "title description")
            .populate("permission_id", "resource actions description")
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: mappings }, { status: 200 });
    } catch (error) {
        console.error("GET /api/role-permissions error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch role-permission mappings." },
            { status: 500 }
        );
    }
}
