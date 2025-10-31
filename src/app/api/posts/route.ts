import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Post } from "@/lib/db/models";

export async function GET() {
    try {
        await connectDB();

        const posts = await Post.find()
            .populate("author_id", "name email") 
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: posts }, { status: 200 });
    } catch (error) {
        console.error("GET /api/posts error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch posts" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();

        const { title, content, author_id, status } = await req.json();

        if (!title || !content || !author_id) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        const newPost = await Post.create({
            title,
            content,
            author_id,
            status: status || "draft",
        });

        return NextResponse.json({ success: true, data: newPost }, { status: 201 });
    } catch (error) {
        console.error("POST /api/posts error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create post" },
            { status: 500 }
        );
    }
}
