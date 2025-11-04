import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Role } from "@/lib/db/models/role.model";
import { RolePermission } from "@/lib/db/models/rolePermission.model";
import { UserRole } from "@/lib/db/models/userRole.model";
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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return respond(false, "Invalid role ID", 400);
    }

    const role = await Role.findById(params.id);

    if (!role) {
      return respond(false, "Role not found", 404);
    }

    return respond(true, "Role fetched successfully", 200, role);
  } catch (error) {
    console.error("GET /api/roles/[id] error:", error);
    return respond(false, "Failed to fetch role", 500);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    const canUpdate = await hasPermission(session.user.id, 'roles', 'update');
    if (!canUpdate) {
      return respond(false, "Forbidden.", 403);
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return respond(false, "Invalid role ID", 400);
    }

    const { title, description } = await req.json();

    const role = await Role.findById(params.id);
    if (!role) {
      return respond(false, "Role not found", 404);
    }

    if (role.is_system) {
      return respond(false, "Cannot modify system roles", 403);
    }

    if (title) role.title = title.trim();
    if (description !== undefined) role.description = description;

    await role.save();

    return respond(true, "Role updated successfully", 200, role);
  } catch (error) {
    console.error("PUT /api/roles/[id] error:", error);
    return respond(false, "Failed to update role", 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    const canDelete = await hasPermission(session.user.id, 'roles', 'delete');
    if (!canDelete) {
      return respond(false, "Forbidden.", 403);
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return respond(false, "Invalid role ID", 400);
    }

    const role = await Role.findById(params.id);
    if (!role) {
      return respond(false, "Role not found", 404);
    }

    if (role.is_system) {
      return respond(false, "Cannot delete system roles", 403);
    }

    await RolePermission.deleteMany({ role_id: params.id });
    await UserRole.deleteMany({ role_id: params.id });
    await Role.findByIdAndDelete(params.id);

    return respond(true, "Role deleted successfully", 200);
  } catch (error) {
    console.error("DELETE /api/roles/[id] error:", error);
    return respond(false, "Failed to delete role", 500);
  }
}