// app/dashboard/posts/edit/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PostForm } from "@/components/posts/PostForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Post } from "@/types/post";

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
          setError(data.message);
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
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !post) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-destructive">
            {error || "Post not found"}
          </h2>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <p className="text-muted-foreground mt-2">
          Update the post details below
        </p>
      </div>
      <PostForm mode="edit" slug={post.slug} initialData={initialData} />
    </DashboardLayout>
  );
}
