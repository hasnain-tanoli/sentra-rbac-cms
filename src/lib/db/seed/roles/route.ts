import { NextResponse } from "next/server";
import { seedRoles } from "../roles.seed";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPermission } from "@/lib/rbac/checkPermission";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Only super admin can seed roles
        const canManage = await hasPermission(session.user.id, "roles", "create");
        if (!canManage) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        const result = await seedRoles();
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error seeding roles:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to seed roles",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}