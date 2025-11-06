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

// GET - Get single permission by ID
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params; // Await params first

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return respond(false, "Invalid permission ID", 400);
        }

        const permission = await Permission.findById(id);

        if (!permission) {
            return respond(false, "Permission not found", 404);
        }

        return respond(true, "Permission fetched successfully", 200, permission);
    } catch (error) {
        console.error("GET /api/permissions/[id] error:", error);
        return respond(false, "Failed to fetch permission", 500);
    }
}

// PUT - Update permission (only description can be updated)
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params; // Await params first

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return respond(false, "Invalid permission ID", 400);
        }

        const body = await req.json();
        const { description } = body;

        const permission = await Permission.findByIdAndUpdate(
            id,
            { description },
            { new: true, runValidators: true }
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

// DELETE - Delete permission and remove all role assignments
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params; // Await params first

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return respond(false, "Invalid permission ID", 400);
        }

        const permission = await Permission.findById(id);
        if (!permission) {
            return respond(false, "Permission not found", 404);
        }

        // Delete all role-permission mappings for this permission
        const deletedAssignments = await RolePermission.deleteMany({
            permission_id: id
        });

        // Delete the permission itself
        await Permission.findByIdAndDelete(id);

        return respond(
            true,
            `Permission deleted successfully. Removed ${deletedAssignments.deletedCount} role assignment(s).`,
            200,
            {
                deletedAssignments: deletedAssignments.deletedCount
            }
        );
    } catch (error) {
        console.error("DELETE /api/permissions/[id] error:", error);
        return respond(false, "Failed to delete permission", 500);
    }
}