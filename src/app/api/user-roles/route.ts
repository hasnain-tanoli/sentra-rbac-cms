import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { UserRole } from "@/lib/db/models/userRole.model";
import { User } from "@/lib/db/models/user.model";
import { Role } from "@/lib/db/models/role.model";
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

// POST - Assign role to user
export async function POST(req: Request) {
  try {
    console.log("POST /api/user-roles - Starting...");

    const session = await getServerSession(authOptions);
    console.log("Session user:", session?.user);

    if (!session?.user) {
      console.log("No session - returning 401");
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    // Check permission
    const canAssign = await hasPermission(session.user.id, 'roles', 'update');
    console.log("Can assign roles:", canAssign);

    // OPTIONAL: Temporarily bypass permission check for testing
    // Comment out these lines to bypass permission check
    if (!canAssign) {
      console.log("Permission denied - returning 403");
      return respond(false, "Forbidden. You don't have permission to assign roles.", 403);
    }

    await connectDB();

    const body = await req.json();
    const { user_id, role_id } = body;

    console.log("Received assignment request:", { user_id, role_id });

    // Validate input
    if (!user_id || !role_id) {
      console.log("Missing required fields");
      return respond(false, "user_id and role_id are required.", 400);
    }

    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      console.log("Invalid user_id format:", user_id);
      return respond(false, "Invalid user_id format.", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(role_id)) {
      console.log("Invalid role_id format:", role_id);
      return respond(false, "Invalid role_id format.", 400);
    }

    // Check if user exists
    console.log("Checking if user exists...");
    const userExists = await User.findById(user_id);
    if (!userExists) {
      console.log("User not found:", user_id);
      return respond(false, "User not found.", 404);
    }
    console.log("User found:", userExists.email);

    // Check if role exists
    console.log("Checking if role exists...");
    const roleExists = await Role.findById(role_id);
    if (!roleExists) {
      console.log("Role not found:", role_id);
      return respond(false, "Role not found.", 404);
    }
    console.log("Role found:", roleExists.title);

    // Check if assignment already exists
    console.log("Checking for existing assignment...");
    const existingAssignment = await UserRole.findOne({ user_id, role_id });
    if (existingAssignment) {
      console.log("Assignment already exists");
      return respond(false, "This role is already assigned to this user.", 409);
    }

    // Create the assignment
    console.log("Creating assignment...");
    const userRole = await UserRole.create({ user_id, role_id });
    console.log("Assignment created:", userRole._id);

    // Populate the response
    const populatedUserRole = await UserRole.findById(userRole._id)
      .populate('user_id', 'name email')
      .populate('role_id', 'title key description');

    console.log("Assignment created successfully");

    return respond(true, "Role assigned to user successfully.", 201, populatedUserRole);
  } catch (error) {
    console.error("POST /api/user-roles error:", error);
    return respond(false, `Failed to assign role to user: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}

// GET - Fetch all user-role assignments
export async function GET() {
  try {
    console.log("GET /api/user-roles - Starting...");

    const session = await getServerSession(authOptions);
    console.log("Session user:", session?.user);

    if (!session?.user) {
      console.log("No session - returning 401");
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    // Check permission
    const canRead = await hasPermission(session.user.id, 'roles', 'read');
    console.log("Can read role assignments:", canRead);

    // OPTIONAL: Temporarily bypass permission check for testing
    // Comment out these lines to bypass permission check
    if (!canRead) {
      console.log("Permission denied - returning 403");
      return respond(false, "Forbidden. You don't have permission to view role assignments.", 403);
    }

    console.log("Connecting to DB...");
    await connectDB();

    console.log("Fetching assignments...");
    const assignments = await UserRole.find()
      .populate('user_id', 'name email is_active')
      .populate('role_id', 'title key description')
      .sort({ created_at: -1 });

    console.log("Assignments found:", assignments.length);

    // Filter out any invalid assignments (where user or role was deleted)
    const validAssignments = assignments.filter(a => a.user_id && a.role_id);
    console.log("Valid assignments:", validAssignments.length);

    return respond(true, "User-role assignments fetched successfully.", 200, validAssignments);
  } catch (error) {
    console.error("GET /api/user-roles error:", error);
    return respond(false, `Failed to fetch user-role assignments: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}

// DELETE - Remove role from user
export async function DELETE(req: Request) {
  try {
    console.log("DELETE /api/user-roles - Starting...");

    const session = await getServerSession(authOptions);
    console.log("Session user:", session?.user);

    if (!session?.user) {
      console.log("No session - returning 401");
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    // Check permission
    const canDelete = await hasPermission(session.user.id, 'roles', 'update');
    console.log("Can delete role assignments:", canDelete);

    // OPTIONAL: Temporarily bypass permission check for testing
    // Comment out these lines to bypass permission check
    if (!canDelete) {
      console.log("Permission denied - returning 403");
      return respond(false, "Forbidden. You don't have permission to remove role assignments.", 403);
    }

    await connectDB();

    const body = await req.json();
    const { user_id, role_id } = body;

    console.log("Received delete request:", { user_id, role_id });

    if (!user_id || !role_id) {
      console.log("Missing required fields");
      return respond(false, "user_id and role_id are required.", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(user_id) || !mongoose.Types.ObjectId.isValid(role_id)) {
      console.log("Invalid ID format");
      return respond(false, "Invalid user_id or role_id format.", 400);
    }

    console.log("Attempting to delete assignment...");
    const result = await UserRole.findOneAndDelete({ user_id, role_id });

    if (!result) {
      console.log("Assignment not found");
      return respond(false, "User-role assignment not found.", 404);
    }

    console.log("Assignment deleted successfully");
    return respond(true, "Role removed from user successfully.", 200);
  } catch (error) {
    console.error("DELETE /api/user-roles error:", error);
    return respond(false, `Failed to remove role from user: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}