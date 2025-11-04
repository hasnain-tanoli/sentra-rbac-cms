import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { RolePermission } from "@/lib/db/models/rolePermission.model";
import { assignPermissionsToRole } from "@/lib/rbac/assignPermissions";
import { hasPermission } from "@/lib/rbac/checkPermission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    const canAssign = await hasPermission(session.user.id, 'roles', 'update');
    if (!canAssign) {
      return respond(false, "Forbidden.", 403);
    }

    await connectDB();

    const { role_id, permission_keys } = await req.json();

    if (!role_id || !Array.isArray(permission_keys) || permission_keys.length === 0) {
      return respond(false, "role_id and permission_keys array are required.", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(role_id)) {
      return respond(false, "Invalid role ID", 400);
    }

    const assignedCount = await assignPermissionsToRole(role_id, permission_keys);

    return respond(
      true,
      `${assignedCount} permission(s) assigned to role successfully.`,
      201,
      { assignedCount }
    );
  } catch (error) {
    console.error("POST /api/role-permissions error:", error);
    const err = error as Error;
    return respond(false, err.message || "Failed to assign permissions to role.", 500);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    const canRead = await hasPermission(session.user.id, 'roles', 'read');
    if (!canRead) {
      return respond(false, "Forbidden.", 403);
    }

    await connectDB();

    const mappings = await RolePermission.find()
      .populate("role_id", "title key description")
      .populate("permission_id", "resource action key description")
      .sort({ created_at: -1 });

    return respond(true, "Role-permission mappings fetched successfully.", 200, mappings);
  } catch (error) {
    console.error("GET /api/role-permissions error:", error);
    return respond(false, "Failed to fetch role-permission mappings.", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    const canDelete = await hasPermission(session.user.id, 'roles', 'update');
    if (!canDelete) {
      return respond(false, "Forbidden.", 403);
    }

    await connectDB();

    const { role_id, permission_id } = await req.json();

    if (!role_id || !permission_id) {
      return respond(false, "role_id and permission_id are required.", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(role_id) || !mongoose.Types.ObjectId.isValid(permission_id)) {
      return respond(false, "Invalid role_id or permission_id", 400);
    }

    const result = await RolePermission.findOneAndDelete({ role_id, permission_id });

    if (!result) {
      return respond(false, "Role-permission mapping not found", 404);
    }

    return respond(true, "Permission removed from role successfully.", 200);
  } catch (error) {
    console.error("DELETE /api/role-permissions error:", error);
    return respond(false, "Failed to remove permission from role.", 500);
  }
}