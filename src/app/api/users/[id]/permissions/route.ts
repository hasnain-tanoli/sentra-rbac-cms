import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/db/connection";
import { getUserPermissions } from "@/lib/rbac/getUserPermissions";

interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
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

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return respond(false, "Unauthorized", 401);
        }

        const { id } = await params;

        if (session.user.id !== id) {
            const { hasPermission } = await import("@/lib/rbac/checkPermission");
            await connectDB();

            const canReadUsers = await hasPermission(session.user.id, "users", "read");

            if (!canReadUsers) {
                return respond(false, "Forbidden. You can only view your own permissions.", 403);
            }
        }

        await connectDB();

        const permissions = await getUserPermissions(id);

        return respond(true, "Permissions fetched successfully", 200, permissions);
    } catch (error) {
        console.error("GET /api/users/[id]/permissions error:", error);
        return respond(false, "Failed to fetch permissions", 500);
    }
}