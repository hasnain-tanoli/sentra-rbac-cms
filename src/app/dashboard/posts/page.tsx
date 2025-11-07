"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Trash2,
  Pencil,
  FileText,
  Plus,
  Loader2,
  User,
  Calendar,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermission";

interface PostAuthor {
  _id: string;
  name: string;
  email: string;
}

interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  author_id: PostAuthor;
  created_at?: string;
  createdAt?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: Post[];
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { toast } = useToast();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;

  const { permissions } = usePermissions();
  const perms = useMemo(
    () => (Array.isArray(permissions) ? permissions : []),
    [permissions]
  );

  const has = useCallback(
    (key: string) =>
      perms.includes(key) ||
      perms.includes(key.replace(".", ":")) ||
      perms.includes(key.replace(":", ".")),
    [perms]
  );

  const canCreatePosts = has("posts.create");
  const canReadPosts = has("posts.read");
  const canUpdatePosts = has("posts.update");
  const canDeleteAnyPost = has("posts.delete");

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const data = (await res.json()) as ApiResponse;
      if (res.ok && data.success && data.data) {
        setPosts(data.data);
      } else {
        toast({
          title: "Error",
          description: data?.message || "Failed to fetch posts",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      toast({
        title: "Error",
        description: "Failed to fetch posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleDelete() {
    if (!deleteSlug) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/posts/${deleteSlug}`, { method: "DELETE" });
      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson ? ((await res.json()) as DeleteResponse) : null;

      if (res.ok && data?.success) {
        setPosts((prev) => prev.filter((post) => post.slug !== deleteSlug));
        toast({
          title: "Success",
          description: data.message || "Post deleted successfully",
        });
        setDeleteSlug(null);
      } else {
        const message =
          data?.message ||
          (res.status === 401
            ? "Unauthorized. Please log in."
            : res.status === 403
            ? "You don't have permission to delete this post."
            : res.status === 404
            ? "Post not found."
            : "Failed to delete post.");

        setDeleteError(message);
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Delete error:", error);
      const message = "Network error. Please try again.";
      setDeleteError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }

  const targetPost = deleteSlug
    ? posts.find((p) => p.slug === deleteSlug)
    : undefined;

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canReadPosts) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                Posts Management
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Manage your blog posts and articles
              </p>
            </div>
          </div>
          <div className="rounded-md border">
            <div className="px-4 py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">Access Denied</p>
              <p className="text-sm">
                You don&apos;t have permission to view posts. Please contact
                your administrator.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
              Posts Management
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage your blog posts and articles
            </p>
          </div>
        </div>

        {/* Action Buttons - Responsive */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard/posts/new" className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto"
              disabled={!canCreatePosts}
              title={!canCreatePosts ? "You need posts.create permission" : ""}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </Link>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteSlug}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteSlug(null);
              setDeleteError(null);
            }
          }}
        >
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the post{" "}
                <strong className="text-foreground">
                  &ldquo;{targetPost?.title}&rdquo;
                </strong>
                .
                <br />
                <br />
                <span className="text-destructive font-medium">
                  This action cannot be undone.
                </span>
                {deleteError && (
                  <div className="mt-3 text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                    {deleteError}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete Post"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Posts - Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Title
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Author
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Status
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Created At
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-2">No posts found</p>
                      <p className="text-sm mb-4">
                        {canCreatePosts
                          ? "Create your first post to get started"
                          : "You may not have permission to create posts"}
                      </p>
                      {canCreatePosts && (
                        <Link href="/dashboard/posts/new">
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Post
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => {
                    const isAuthor =
                      currentUserId && post.author_id?._id === currentUserId;
                    const canEditThis = canUpdatePosts || !!isAuthor;
                    const canDeleteThis = canDeleteAnyPost || !!isAuthor;

                    const created =
                      post.createdAt || post.created_at
                        ? new Date(
                            post.createdAt ?? post.created_at!
                          ).toLocaleDateString()
                        : "—";

                    return (
                      <tr
                        key={post._id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="border-b px-4 py-3 font-medium">
                          {post.title}
                        </td>
                        <td className="border-b px-4 py-3 text-sm text-muted-foreground">
                          {post.author_id?.name || "Unknown"}
                        </td>
                        <td className="border-b px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              post.status === "published"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {post.status}
                          </span>
                        </td>
                        <td className="border-b px-4 py-3 text-sm text-muted-foreground">
                          {created}
                        </td>
                        <td className="border-b px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/posts/edit/${post.slug}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canEditThis}
                                title={
                                  !canEditThis
                                    ? "You need posts.update or be the author"
                                    : "Edit post"
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canDeleteThis}
                              title={
                                !canDeleteThis
                                  ? "You need posts.delete or be the author"
                                  : "Delete post"
                              }
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteSlug(post.slug);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Posts - Mobile Card View */}
        <div className="md:hidden space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-md border">
              <div className="px-4 py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">No posts found</p>
                <p className="text-sm mb-4">
                  {canCreatePosts
                    ? "Create your first post to get started"
                    : "You may not have permission to create posts"}
                </p>
                {canCreatePosts && (
                  <Link href="/dashboard/posts/new">
                    <Button className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Post
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            posts.map((post) => {
              const isAuthor =
                currentUserId && post.author_id?._id === currentUserId;
              const canEditThis = canUpdatePosts || !!isAuthor;
              const canDeleteThis = canDeleteAnyPost || !!isAuthor;

              const created =
                post.createdAt || post.created_at
                  ? new Date(
                      post.createdAt ?? post.created_at!
                    ).toLocaleDateString()
                  : "—";

              return (
                <div
                  key={post._id}
                  className="rounded-md border p-4 space-y-3 bg-card hover:bg-muted/30 transition-colors"
                >
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-base line-clamp-2 flex-1">
                      {post.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                        post.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  {/* Author & Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>{post.author_id?.name || "Unknown"}</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{created}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/dashboard/posts/edit/${post.slug}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={!canEditThis}
                        title={
                          !canEditThis
                            ? "You need posts.update or be the author"
                            : "Edit post"
                        }
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={!canDeleteThis}
                      title={
                        !canDeleteThis
                          ? "You need posts.delete or be the author"
                          : "Delete post"
                      }
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteSlug(post.slug);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Statistics - Responsive */}
        {posts.length > 0 && (
          <div className="grid grid-cols-3 gap-4 p-4 rounded-md border bg-muted/30">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Posts
              </p>
              <p className="text-lg sm:text-xl font-bold">{posts.length}</p>
            </div>
            <div className="text-center border-x">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Published
              </p>
              <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                {publishedCount}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Drafts
              </p>
              <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {draftCount}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
