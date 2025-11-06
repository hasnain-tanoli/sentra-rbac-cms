"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PostForm } from "@/components/posts/PostForm";

export default function NewPostPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to create a new post
        </p>
      </div>
      <PostForm mode="create" />
    </DashboardLayout>
  );
}
