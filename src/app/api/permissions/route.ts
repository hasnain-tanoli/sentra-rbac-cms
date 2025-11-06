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
        const body = (await req.json()) as {
            resource?: string;
            action?: string;
            description?: string;
        };

        const { resource, action, description } = body;

        if (!resource || !action) {
            return respond(false, "Resource and action are required", 400);
        }

        const resourceNormalized = resource.toLowerCase() as Resource;
        const actionNormalized = action.toLowerCase() as Action;

        if (!RESOURCES.includes(resourceNormalized)) {
            return respond(false, `Invalid resource. Must be one of: ${RESOURCES.join(", ")}`, 400);
        }

        if (!ACTIONS.includes(actionNormalized)) {
            return respond(false, `Invalid action. Must be one of: ${ACTIONS.join(", ")}`, 400);
        }

        const key = `${resourceNormalized}.${actionNormalized}`;

        const existingPermission = await Permission.findOne({
            resource: resourceNormalized,
            action: actionNormalized,
        });
        if (existingPermission) {
            return respond(false, "Permission with this resource and action already exists", 409);
        }

        const permission = await Permission.create({
            resource: resourceNormalized,
            action: actionNormalized,
            key,
            description: description || `${actionNormalized.toUpperCase()} ${resourceNormalized}`,
        });

        return respond(true, "Permission created successfully", 201, permission);
    } catch (error) {
        console.error("POST /api/permissions error:", error);
        return respond(false, "Failed to create permission", 500);
    }
}

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const schema = searchParams.get("schema");

        if (schema === "true") {
            return respond(true, "Permission schema fetched successfully", 200, {
                actions: ACTIONS,
                resources: RESOURCES,
            });
        }

        const permissions = await Permission.find().sort({ resource: 1, action: 1 });
        return respond(true, "Permissions fetched successfully", 200, permissions);
    } catch (error) {
        console.error("GET /api/permissions error:", error);
        return respond(false, "Failed to fetch permissions", 500);
    }
}