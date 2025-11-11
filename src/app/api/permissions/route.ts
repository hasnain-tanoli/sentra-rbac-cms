import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connection";
import { Permission, ACTIONS, RESOURCES, Action, Resource, SYSTEM_RESOURCES } from "@/lib/db/models/permission.model";
import { Role } from "@/lib/db/models/role.model";
import { RolePermission } from "@/lib/db/models/rolePermission.model";

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
    let session: mongoose.ClientSession | null = null;

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

        const existingPermission = await Permission.findOne({ key });
        if (existingPermission) {
            return respond(false, "Permission with this resource and action already exists", 409);
        }

        const superAdminRole = await Role.findOne({ key: 'super_admin' });
        if (!superAdminRole) {
            console.error("CRITICAL: 'super_admin' role not found during permission creation. System is misconfigured.");
            return respond(false, "System configuration error: Super admin role is missing. Cannot create permission.", 500);
        }

        if (!superAdminRole.is_system) {
            console.warn(`⚠️ Configuration Warning: The 'super_admin' role is not marked as a system role.`);
        }

        session = await mongoose.startSession();
        session.startTransaction();

        let permission;
        try {
            const isSystemPermission = SYSTEM_RESOURCES.includes(resourceNormalized);

            [permission] = await Permission.create([{
                resource: resourceNormalized,
                action: actionNormalized,
                key,
                description: description || `${actionNormalized.toUpperCase()} ${resourceNormalized}`,
                is_system: isSystemPermission,
            }], { session });

            // Always assign ALL new permissions to super_admin role
            await RolePermission.create([{
                role_id: superAdminRole._id,
                permission_id: permission._id
            }], { session });

            console.info(`✅ [Transaction] Auto-assigned permission '${key}' to 'super_admin' role.`);

            await session.commitTransaction();

        } catch (transactionError) {
            if (session) await session.abortTransaction();
            throw transactionError;
        }

        return respond(true, "Permission created successfully", 201, permission);

    } catch (error) {
        console.error("POST /api/permissions - Failed to create permission:", error);
        return respond(false, "Failed to create permission", 500);

    } finally {
        if (session) {
            session.endSession();
        }
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