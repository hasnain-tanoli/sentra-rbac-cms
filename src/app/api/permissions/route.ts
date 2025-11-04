import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Permission, ACTIONS, RESOURCES, Action, Resource } from "@/lib/db/models/permission.model";

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

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        const { resource, action, description } = body;

        if (!resource || !action) {
            return respond(false, "Resource and action are required", 400);
        }

        if (!RESOURCES.includes(resource)) {
            return respond(false, `Invalid resource. Must be one of: ${RESOURCES.join(', ')}`, 400);
        }

        if (!ACTIONS.includes(action)) {
            return respond(false, `Invalid action. Must be one of: ${ACTIONS.join(', ')}`, 400);
        }

        const existingPermission = await Permission.findOne({ resource, action });
        if (existingPermission) {
            return respond(false, "Permission with this resource and action already exists", 409);
        }

        const permission = await Permission.create({
            resource: resource as Resource,
            action: action as Action,
            description
        });

        return respond(true, "Permission created successfully", 201, permission);
    } catch (error) {
        console.error("POST /api/permissions error:", error);
        return respond(false, "Failed to create permission", 500);
    }
}

export async function GET() {
    try {
        await connectDB();

        const permissions = await Permission.find().sort({ resource: 1, action: 1 });
        return respond(true, "Permissions fetched successfully", 200, permissions);
    } catch (error) {
        console.error("GET /api/permissions error:", error);
        return respond(false, "Failed to fetch permissions", 500);
    }
}