import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Role } from "@/lib/db/models/role.model";
import { getAuthSession } from "@/lib/auth"; // ✅ Make sure this helper exists

// ✅ CREATE a new role (Admin only)
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    // 🔒 Authentication check
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 🔒 Authorization check — only admins can create roles
    if (!session.user.roles.includes("admin")) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { title, description } = body;

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "A valid role title is required." },
        { status: 400 }
      );
    }

    // Check for duplicate role title
    const existingRole = await Role.findOne({ title: title.trim() });
    if (existingRole) {
      return NextResponse.json(
        { success: false, message: "A role with this title already exists." },
        { status: 409 }
      );
    }

    const role = await Role.create({
      title: title.trim(),
      description,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Role created successfully.",
        data: role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/roles error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create role." },
      { status: 500 }
    );
  }
}

// ✅ GET all roles (Admin only)
export async function GET() {
  try {
    const session = await getAuthSession();

    // 🔒 Authentication check
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 🔒 Authorization check — only admins can view all roles
    if (!session.user.roles.includes("admin")) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    await connectDB();

    const roles = await Role.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: roles }, { status: 200 });
  } catch (error) {
    console.error("GET /api/roles error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch roles." },
      { status: 500 }
    );
  }
}
