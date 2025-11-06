"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PostForm } from "@/components/posts/PostForm";
import { Button } from "@/components/ui/button";
import { Post } from "@/types/post";
import { FileText, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface ApiResponse {
  success: boolean;
  message: string;
  data?: Post;
}

interface PostFormData {
  title: string;
  content: string;
  status: "draft" | "published";
  slug: string;
}

export default function EditPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${slug}`);
        const data = (await res.json()) as ApiResponse;

        if (data.success && data.data) {
          setPost(data.data);
        } else {
          setError(data.message || "Failed to load post");
        }
      } catch (err) {
        console.error("Failed to fetch post:", err);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading post...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !post) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8" />
                Edit Post
              </h1>
              <p className="text-muted-foreground mt-2">
                Update the post details below
              </p>
            </div>
            <Link href="/dashboard/posts">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Posts
              </Button>
            </Link>
          </div>

          {/* Error State */}
          <div className="rounded-md border">
            <div className="px-4 py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20 text-destructive" />
              <h2 className="text-xl font-semibold text-destructive mb-2">
                {error || "Post not found"}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                The post you&apos;re looking for doesn&apos;t exist or you
                don&apos;t have permission to edit it.
              </p>
              <Link href="/dashboard/posts">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Posts
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const initialData: PostFormData = {
    title: post.title,
    content: post.content,
    status: post.status,
    slug: post.slug,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Edit Post
            </h1>
            <p className="text-muted-foreground mt-2">
              Update the post details below
            </p>
          </div>
          <Link href="/dashboard/posts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Button>
          </Link>
        </div>

        {/* Post Form */}
        <PostForm mode="edit" slug={post.slug} initialData={initialData} />
      </div>
    </DashboardLayout>
  );
}
