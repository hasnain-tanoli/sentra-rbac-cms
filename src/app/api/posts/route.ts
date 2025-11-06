// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Post } from "@/lib/db/models/post.model";
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

// Helper function to generate slug
function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/-+/g, '-')            // Replace multiple - with single -
    .replace(/^-+|-+$/g, '');       // Remove leading/trailing -
}

export async function GET() {
  try {
    await connectDB();

    const posts = await Post.find()
      .populate("author_id", "name email")
      .sort({ created_at: -1 });

    return respond(true, "Posts fetched successfully", 200, posts);
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return respond(false, "Failed to fetch posts", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    await connectDB();

    const canCreate = await hasPermission(session.user.id, 'posts', 'create');
    if (!canCreate) {
      return respond(false, "Forbidden. You don't have permission to create posts.", 403);
    }

    const { title, content, status } = await req.json();

    if (!title || !content) {
      return respond(false, "Title and content are required", 400);
    }

    // Generate base slug from title
    const baseSlug = slugify(title);

    // Check for existing slugs and make unique if necessary
    let slug = baseSlug;
    let count = 0;

    while (await Post.findOne({ slug })) {
      count++;
      slug = `${baseSlug}-${count}`;
    }

    // Create new post with generated slug
    const newPost = new Post({
      title,
      slug,
      content,
      author_id: session.user.id,
      status: status || "draft",
    });

    await newPost.save();

    const populatedPost = await Post.findById(newPost._id)
      .populate("author_id", "name email");

    return respond(true, "Post created successfully", 201, populatedPost);
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return respond(false, "Failed to create post", 500);
  }
}