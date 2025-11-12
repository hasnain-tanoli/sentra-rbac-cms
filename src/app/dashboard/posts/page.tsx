"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import useSWR, { mutate } from "swr";
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

const StatusBadge = memo(({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
      status === "published"
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }`}
  >
    {status}
  </span>
));
StatusBadge.displayName = "StatusBadge";

const PostTableRow = memo(
  ({
    post,
    currentUserId,
    canUpdatePosts,
    canDeleteAnyPost,
    onDelete,
  }: {
    post: Post;
    currentUserId: string | null;
    canUpdatePosts: boolean;
    canDeleteAnyPost: boolean;
    onDelete: (slug: string) => void;
  }) => {
    const isAuthor = currentUserId && post.author_id?._id === currentUserId;
    const canEditThis = canUpdatePosts || !!isAuthor;
    const canDeleteThis = canDeleteAnyPost || !!isAuthor;

    const created =
      post.createdAt || post.created_at
        ? new Date(post.createdAt ?? post.created_at!).toLocaleDateString()
        : "—";

    return (
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="border-b px-4 py-3 font-medium">{post.title}</td>
        <td className="border-b px-4 py-3 text-sm text-muted-foreground">
          {post.author_id?.name || "Unknown"}
        </td>
        <td className="border-b px-4 py-3">
          <StatusBadge status={post.status} />
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
              onClick={() => onDelete(post.slug)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }
);
PostTableRow.displayName = "PostTableRow";

const PostMobileCard = memo(
  ({
    post,
    currentUserId,
    canUpdatePosts,
    canDeleteAnyPost,
    onDelete,
  }: {
    post: Post;
    currentUserId: string | null;
    canUpdatePosts: boolean;
    canDeleteAnyPost: boolean;
    onDelete: (slug: string) => void;
  }) => {
    const isAuthor = currentUserId && post.author_id?._id === currentUserId;
    const canEditThis = canUpdatePosts || !!isAuthor;
    const canDeleteThis = canDeleteAnyPost || !!isAuthor;

    const created =
      post.createdAt || post.created_at
        ? new Date(post.createdAt ?? post.created_at!).toLocaleDateString()
        : "—";

    return (
      <div className="rounded-md border p-4 space-y-3 bg-card hover:bg-muted/30 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-base line-clamp-2 flex-1">
            {post.title}
          </h3>
          <StatusBadge status={post.status} />
        </div>

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

        <div className="flex gap-2 pt-2">
          <Link href={`/dashboard/posts/edit/${post.slug}`} className="flex-1">
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
            onClick={() => onDelete(post.slug)}
          >
            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
            Delete
          </Button>
        </div>
      </div>
    );
  }
);
PostMobileCard.displayName = "PostMobileCard";

const EmptyState = memo(({ canCreatePosts }: { canCreatePosts: boolean }) => (
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </Link>
    )}
  </div>
));
EmptyState.displayName = "EmptyState";

const StatsCard = memo(
  ({
    totalPosts,
    publishedCount,
    draftCount,
  }: {
    totalPosts: number;
    publishedCount: number;
    draftCount: number;
  }) => (
    <div className="grid grid-cols-3 gap-4 p-4 rounded-md border bg-muted/30">
      <div className="text-center">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
          Total Posts
        </p>
        <p className="text-lg sm:text-xl font-bold">{totalPosts}</p>
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
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Drafts</p>
        <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
          {draftCount}
        </p>
      </div>
    </div>
  )
);
StatsCard.displayName = "StatsCard";

export default function PostsPage() {
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { toast } = useToast();
  const { data: session } = useSession();
  const currentUserId = useMemo(
    () => session?.user?.id ?? null,
    [session?.user?.id]
  );

  const { permissions } = usePermissions();

  const { data: postsData, isLoading: postsLoading } =
    useSWR<ApiResponse>("/api/posts");

  const posts = useMemo(() => postsData?.data || [], [postsData?.data]);

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

  const canCreatePosts = useMemo(() => has("posts.create"), [has]);
  const canReadPosts = useMemo(() => has("posts.read"), [has]);
  const canUpdatePosts = useMemo(() => has("posts.update"), [has]);
  const canDeleteAnyPost = useMemo(() => has("posts.delete"), [has]);

  const handleOpenDeleteDialog = useCallback((slug: string) => {
    setDeleteError(null);
    setDeleteSlug(slug);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteSlug(null);
    setDeleteError(null);
  }, []);

  const handleDelete = useCallback(async () => {
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
        await mutate("/api/posts");

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
  }, [deleteSlug, toast]);

  const targetPost = useMemo(
    () => (deleteSlug ? posts.find((p) => p.slug === deleteSlug) : undefined),
    [deleteSlug, posts]
  );

  const stats = useMemo(
    () => ({
      totalPosts: posts.length,
      publishedCount: posts.filter((p) => p.status === "published").length,
      draftCount: posts.filter((p) => p.status === "draft").length,
    }),
    [posts]
  );

  if (postsLoading) {
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

        <AlertDialog open={!!deleteSlug} onOpenChange={handleCloseDeleteDialog}>
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
                    <td colSpan={5}>
                      <EmptyState canCreatePosts={canCreatePosts} />
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <PostTableRow
                      key={post._id}
                      post={post}
                      currentUserId={currentUserId}
                      canUpdatePosts={canUpdatePosts}
                      canDeleteAnyPost={canDeleteAnyPost}
                      onDelete={handleOpenDeleteDialog}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-md border">
              <EmptyState canCreatePosts={canCreatePosts} />
            </div>
          ) : (
            posts.map((post) => (
              <PostMobileCard
                key={post._id}
                post={post}
                currentUserId={currentUserId}
                canUpdatePosts={canUpdatePosts}
                canDeleteAnyPost={canDeleteAnyPost}
                onDelete={handleOpenDeleteDialog}
              />
            ))
          )}
        </div>

        {posts.length > 0 && (
          <StatsCard
            totalPosts={stats.totalPosts}
            publishedCount={stats.publishedCount}
            draftCount={stats.draftCount}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
