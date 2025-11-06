"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Trash2, Edit } from "lucide-react";
import { usePermissions } from "@/hooks/usePermission";

interface PostAuthor {
  _id: string; // include author id so we can detect ownership
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
  created_at?: string; // if your model uses created_at
  createdAt?: string; // if using default mongoose createdAt
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

  // helper: match dot or colon separators
  const has = (key: string) =>
    perms.includes(key) ||
    perms.includes(key.replace(".", ":")) ||
    perms.includes(key.replace(":", "."));

  const canCreatePosts = has("posts.create");
  const canReadPosts = has("posts.read");
  const canUpdatePosts = has("posts.update");
  const canDeleteAnyPost = has("posts.delete");

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
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
  }

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
        toast({ title: "Success", description: data.message });
        setDeleteSlug(null); // close dialog on success
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

        setDeleteError(message); // keep dialog open and show message
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

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Posts</h1>
        <Link href="/dashboard/posts/new">
          <Button
            disabled={!canCreatePosts}
            title={!canCreatePosts ? "You need posts.create" : ""}
          >
            Create New Post
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading posts...</p>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No posts found.{" "}
              {canCreatePosts
                ? "Create your first post!"
                : "You may not have permission to create posts."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Posts ({posts.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => {
                  const isAuthor =
                    currentUserId && post.author_id?._id === currentUserId;
                  const canEditThis = canUpdatePosts || !!isAuthor;
                  const canDeleteThis = canDeleteAnyPost || !!isAuthor;

                  const created =
                    post.createdAt || post.created_at
                      ? new Date(
                          post.createdAt ?? post.created_at!
                        ).toLocaleDateString()
                      : "";

                  return (
                    <TableRow key={post._id}>
                      <TableCell className="font-medium">
                        {post.title}
                      </TableCell>
                      <TableCell>{post.author_id?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.status === "published"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {post.status}
                        </span>
                      </TableCell>
                      <TableCell>{created}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/posts/edit/${post.slug}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!canEditThis}
                              title={
                                !canEditThis
                                  ? "You need posts.update or be the author"
                                  : ""
                              }
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={!canDeleteThis}
                            title={
                              !canDeleteThis
                                ? "You need posts.delete or be the author"
                                : ""
                            }
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteSlug(post.slug);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!deleteSlug}
        onOpenChange={(open) => !open && setDeleteSlug(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              post.
              {deleteError && (
                <div className="mt-3 text-red-600 text-sm">{deleteError}</div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
