import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Role } from "@/lib/db/models/role.model";
import { hasPermission } from "@/lib/rbac/checkPermission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

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

function generateRoleKey(title: string): string {
  let key = title.trim().toLowerCase();

  key = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  key = key.replace(/[^a-z0-9]+/g, '_');

  key = key.replace(/_+/g, '_');

  key = key.replace(/^_+|_+$/g, '');

  return key;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    const canCreate = await hasPermission(session.user.id, 'roles', 'create');
    if (!canCreate) {
      return respond(false, "Forbidden. You don't have permission to create roles.", 403);
    }

    await connectDB();

    const body = await req.json();
    const { title, description } = body;

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return respond(false, "A valid role title is required (minimum 2 characters).", 400);
    }

    const key = generateRoleKey(title);

    if (!key) {
      return respond(false, "Role title must contain at least one alphanumeric character.", 400);
    }

    const existingRole = await Role.findOne({
      $or: [
        { title: title.trim() },
        { key: key }
      ]
    });

    if (existingRole) {
      const trimmedTitle = title.trim();
      const titleMatches = existingRole.title.trim() === trimmedTitle;
      const keyMatches = existingRole.key === key;

      let errorMessage: string;
      if (titleMatches && keyMatches) {
        errorMessage = "A role with this title or key already exists.";
      } else if (titleMatches) {
        errorMessage = "A role with this title already exists.";
      } else {
        errorMessage = "A role with this key already exists.";
      }

      return respond(false, errorMessage, 409);
    }

    const role = await Role.create({
      title: title.trim(),
      key: key,
      description: description?.trim() || "",
      is_system: false,
    });

    return respond(true, "Role created successfully.", 201, role);
  } catch (error) {
    console.error("POST /api/roles error:", error);
    return respond(false, "Failed to create role.", 500);
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
      return respond(false, "Forbidden. You don't have permission to read roles.", 403);
    }

    await connectDB();

    const roles = await Role.find().sort({ created_at: -1 });
    return respond(true, "Roles fetched successfully.", 200, roles);
  } catch (error) {
    console.error("GET /api/roles error:", error);
    return respond(false, "Failed to fetch roles.", 500);
  }
}