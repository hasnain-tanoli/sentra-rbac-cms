import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Permission } from "@/lib/db/models/permission.model";
import { RolePermission } from "@/lib/db/models/rolePermission.model";
import mongoose from "mongoose";

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
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return respond(false, "Invalid permission ID", 400);
        }

        const permission = await Permission.findById(params.id);

        if (!permission) {
            return respond(false, "Permission not found", 404);
        }

        return respond(true, "Permission fetched successfully", 200, permission);
    } catch (error) {
        console.error("GET /api/permissions/[id] error:", error);
        return respond(false, "Failed to fetch permission", 500);
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return respond(false, "Invalid permission ID", 400);
        }

        const body = await req.json();
        const { description } = body;

        const permission = await Permission.findByIdAndUpdate(
            params.id,
            { description },
            { new: true }
        );

        if (!permission) {
            return respond(false, "Permission not found", 404);
        }

        return respond(true, "Permission updated successfully", 200, permission);
    } catch (error) {
        console.error("PUT /api/permissions/[id] error:", error);
        return respond(false, "Failed to update permission", 500);
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return respond(false, "Invalid permission ID", 400);
        }

        const permission = await Permission.findById(params.id);
        if (!permission) {
            return respond(false, "Permission not found", 404);
        }

        await RolePermission.deleteMany({ permission_id: params.id });
        await Permission.findByIdAndDelete(params.id);

        return respond(true, "Permission deleted successfully", 200);
    } catch (error) {
        console.error("DELETE /api/permissions/[id] error:", error);
        return respond(false, "Failed to delete permission", 500);
    }
}