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

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const post = await Post.findOne({ slug: params.slug })
      .populate("author_id", "name email");

    if (!post) {
      return respond(false, "Post not found", 404);
    }

    return respond(true, "Post fetched successfully", 200, post);
  } catch (error) {
    console.error("GET /api/posts/[slug] error:", error);
    return respond(false, "Failed to fetch post", 500);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    await connectDB();

    const post = await Post.findOne({ slug: params.slug });

    if (!post) {
      return respond(false, "Post not found", 404);
    }

    const isAuthor = post.author_id.toString() === session.user.id;
    const canUpdate = await hasPermission(session.user.id, 'posts', 'update');

    if (!isAuthor && !canUpdate) {
      return respond(false, "Forbidden. You can only update your own posts.", 403);
    }

    const { title, content, status } = await req.json();

    if (title) post.title = title;
    if (content) post.content = content;
    if (status) post.status = status;

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("author_id", "name email");

    return respond(true, "Post updated successfully", 200, updatedPost);
  } catch (error) {
    console.error("PUT /api/posts/[slug] error:", error);
    return respond(false, "Failed to update post", 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return respond(false, "Unauthorized. Please log in.", 401);
    }

    await connectDB();

    const post = await Post.findOne({ slug: params.slug });

    if (!post) {
      return respond(false, "Post not found", 404);
    }

    const isAuthor = post.author_id.toString() === session.user.id;
    const canDelete = await hasPermission(session.user.id, 'posts', 'delete');

    if (!isAuthor && !canDelete) {
      return respond(false, "Forbidden. You can only delete your own posts.", 403);
    }

    await Post.findByIdAndDelete(post._id);

    return respond(true, "Post deleted successfully", 200);
  } catch (error) {
    console.error("DELETE /api/posts/[slug] error:", error);
    return respond(false, "Failed to delete post", 500);
  }
}