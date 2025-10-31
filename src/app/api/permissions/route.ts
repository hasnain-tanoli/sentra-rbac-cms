import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Permission } from "@/lib/db/models/permission.model";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        const { resource, actions, description } = body;

        if (!resource || !Array.isArray(actions) || actions.length === 0) {
            return NextResponse.json(
                { success: false, message: "Resource and at least one action are required" },
                { status: 400 }
            );
        }

        const permission = await Permission.create({ resource, actions, description });

        return NextResponse.json(
            {
                success: true,
                message: "Permission created successfully",
                data: permission,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/permissions error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create permission" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await connectDB();

        const permissions = await Permission.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: permissions }, { status: 200 });
    } catch (error) {
        console.error("GET /api/permissions error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch permissions" },
            { status: 500 }
        );
    }
}
