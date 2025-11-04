import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { UserRole } from "@/lib/db/models/userRole.model";
import { assignRolesToUser } from "@/lib/rbac/assignRoles";
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

    const canAssign = await hasPermission(session.user.id, 'users', 'update');
    if (!canAssign) {
      return respond(false, "Forbidden.", 403);
    }

    await connectDB();

    const { user_id, role_keys } = await req.json();

    if (!user_id || !Array.isArray(role_keys) || role_keys.length === 0) {
      return respond(false, "user_id and role_keys array are required.", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return respond(false, "Invalid user ID", 400);
    }

    const assignedCount = await assignRolesToUser(user_id, role_keys);

    return respond(
      true,
      `${assignedCount} role(s) assigned to user successfully.`,
      201,
      { assignedCount }
    );
  } catch (error) {
    console.error("POST /api/user-roles error:", error);
    const err = error as Error;
    return respond(false, err.message || "Failed to assign roles to user.", 500);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    const canRead = await hasPermission(session.user.id, 'users', 'read');
    if (!canRead) {
      return respond(false, "Forbidden.", 403);
    }

    await connectDB();

    const assignments = await UserRole.find()
      .populate("user_id", "name email")
      .populate("role_id", "title key description")
      .sort({ created_at: -1 });

    const validAssignments = assignments.filter(
      (a) => a.user_id && a.role_id && a.user_id._id && a.role_id._id
    );

    return respond(
      true,
      "User-role assignments fetched successfully.",
      200,
      validAssignments
    );
  } catch (error) {
    console.error("GET /api/user-roles error:", error);
    return respond(false, "Failed to fetch user-role assignments.", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    const canDelete = await hasPermission(session.user.id, 'users', 'update');
    if (!canDelete) {
      return respond(false, "Forbidden.", 403);
    }

    await connectDB();

    const { user_id, role_id } = await req.json();

    if (!user_id || !role_id) {
      return respond(false, "user_id and role_id are required.", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(user_id) || !mongoose.Types.ObjectId.isValid(role_id)) {
      return respond(false, "Invalid user_id or role_id", 400);
    }

    const result = await UserRole.findOneAndDelete({ user_id, role_id });

    if (!result) {
      return respond(false, "User-role assignment not found", 404);
    }

    return respond(true, "Role removed from user successfully.", 200);
  } catch (error) {
    console.error("DELETE /api/user-roles error:", error);
    return respond(false, "Failed to remove role from user.", 500);
  }
}