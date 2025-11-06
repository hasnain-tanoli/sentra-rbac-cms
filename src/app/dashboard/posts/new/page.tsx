"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PostForm } from "@/components/posts/PostForm";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPostPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Create New Post
            </h1>
            <p className="text-muted-foreground mt-2">
              Fill in the details below to create a new post
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
        <PostForm mode="create" />
      </div>
    </DashboardLayout>
  );
}
