"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePermissions } from "@/hooks/usePermission";
import { PERMISSION_KEYS } from "@/lib/constants/permissions";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Users,
  Shield,
  Settings,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalRoles: number;
  totalPermissions: number;
  publishedPosts: number;
  draftPosts: number;
}

interface Post {
  _id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  author_id: {
    name: string;
  };
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    const ct = res.headers.get("content-type");
    if (!ct || !ct.includes("application/json")) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

export default function DashboardPage() {
  const router = useRouter();
  const {
    permissions,
    loading: permsLoading,
    hasPermission,
  } = usePermissions();
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalRoles: 0,
    totalPermissions: 0,
    publishedPosts: 0,
    draftPosts: 0,
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Check permissions
  const canReadUsers = hasPermission(PERMISSION_KEYS.USERS_READ);
  const canReadPosts = hasPermission(PERMISSION_KEYS.POSTS_READ);
  const canReadRoles = hasPermission(PERMISSION_KEYS.ROLES_READ);
  const canReadPermissions = hasPermission(PERMISSION_KEYS.PERMISSIONS_READ);

  const canManagePosts = useMemo(
    () =>
      hasPermission(PERMISSION_KEYS.POSTS_CREATE) ||
      hasPermission(PERMISSION_KEYS.POSTS_UPDATE) ||
      hasPermission(PERMISSION_KEYS.POSTS_DELETE),
    [hasPermission]
  );

  const canManageUsers = useMemo(
    () =>
      hasPermission(PERMISSION_KEYS.USERS_CREATE) ||
      hasPermission(PERMISSION_KEYS.USERS_READ) ||
      hasPermission(PERMISSION_KEYS.USERS_UPDATE) ||
      hasPermission(PERMISSION_KEYS.USERS_DELETE),
    [hasPermission]
  );

  const canManageRoles = useMemo(
    () =>
      hasPermission(PERMISSION_KEYS.ROLES_CREATE) ||
      hasPermission(PERMISSION_KEYS.ROLES_READ) ||
      hasPermission(PERMISSION_KEYS.ROLES_UPDATE) ||
      hasPermission(PERMISSION_KEYS.ROLES_DELETE),
    [hasPermission]
  );

  const canManagePermissions = useMemo(
    () =>
      hasPermission(PERMISSION_KEYS.PERMISSIONS_CREATE) ||
      hasPermission(PERMISSION_KEYS.PERMISSIONS_READ) ||
      hasPermission(PERMISSION_KEYS.PERMISSIONS_UPDATE) ||
      hasPermission(PERMISSION_KEYS.PERMISSIONS_DELETE),
    [hasPermission]
  );

  // Check if user only has posts.read permission
  const hasOnlyPostsRead = useMemo(() => {
    return (
      permissions.length === 1 && permissions[0] === PERMISSION_KEYS.POSTS_READ
    );
  }, [permissions]);

  // Check if user has any dashboard access
  const hasDashboardAccess = useMemo(() => {
    return (
      canManageUsers || canManageRoles || canManagePermissions || canManagePosts
    );
  }, [canManageUsers, canManageRoles, canManagePermissions, canManagePosts]);

  const nothingToShow = useMemo(
    () => !permsLoading && permissions.length === 0,
    [permsLoading, permissions.length]
  );

  // Redirect users with only posts.read or no dashboard access to home page
  useEffect(() => {
    if (!permsLoading && (hasOnlyPostsRead || !hasDashboardAccess)) {
      router.replace("/");
    }
  }, [permsLoading, hasOnlyPostsRead, hasDashboardAccess, router]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (permsLoading || hasOnlyPostsRead || !hasDashboardAccess) return;

      setLoading(true);

      try {
        const promises: Promise<Response>[] = [];

        if (canReadUsers) promises.push(fetch("/api/users"));
        if (canReadPosts) promises.push(fetch("/api/posts"));
        if (canReadRoles) promises.push(fetch("/api/roles"));
        if (canReadPermissions) promises.push(fetch("/api/permissions"));

        if (promises.length === 0) {
          setLoading(false);
          return;
        }

        const responses = await Promise.all(promises);
        let userCount = 0;
        let postCount = 0;
        let roleCount = 0;
        let permCount = 0;
        let published = 0;
        let draft = 0;
        let posts: Post[] = [];

        let idx = 0;

        if (canReadUsers) {
          const data = await safeJson<ApiResponse<unknown[]>>(responses[idx++]);
          if (data?.success && Array.isArray(data.data)) {
            userCount = data.data.length;
          }
        }

        if (canReadPosts) {
          const data = await safeJson<ApiResponse<Post[]>>(responses[idx++]);
          if (data?.success && Array.isArray(data.data)) {
            posts = data.data;
            postCount = posts.length;
            published = posts.filter((p) => p.status === "published").length;
            draft = posts.filter((p) => p.status === "draft").length;
          }
        }

        if (canReadRoles) {
          const data = await safeJson<ApiResponse<unknown[]>>(responses[idx++]);
          if (data?.success && Array.isArray(data.data)) {
            roleCount = data.data.length;
          }
        }

        if (canReadPermissions) {
          const data = await safeJson<ApiResponse<unknown[]>>(responses[idx++]);
          if (data?.success && Array.isArray(data.data)) {
            permCount = data.data.length;
          }
        }

        setStats({
          totalUsers: userCount,
          totalPosts: postCount,
          totalRoles: roleCount,
          totalPermissions: permCount,
          publishedPosts: published,
          draftPosts: draft,
        });

        setRecentPosts(posts.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    void fetchDashboardData();
  }, [
    permsLoading,
    hasOnlyPostsRead,
    hasDashboardAccess,
    canReadUsers,
    canReadPosts,
    canReadRoles,
    canReadPermissions,
    toast,
  ]);

  const resourceData = useMemo(
    () => [
      { name: "Users", value: stats.totalUsers },
      { name: "Posts", value: stats.totalPosts },
      { name: "Roles", value: stats.totalRoles },
      { name: "Permissions", value: stats.totalPermissions },
    ],
    [stats]
  );

  const postStatusData = useMemo(
    () => [
      { name: "Published", value: stats.publishedPosts },
      { name: "Draft", value: stats.draftPosts },
    ],
    [stats.publishedPosts, stats.draftPosts]
  );

  const uiLoading = loading || permsLoading;

  // Show loading while checking permissions or redirecting
  if (permsLoading || hasOnlyPostsRead || !hasDashboardAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here&apos;s your overview.
          </p>
        </div>

        {uiLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
              Loading dashboard...
            </span>
          </div>
        ) : nothingToShow ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                You don&apos;t have any permissions assigned yet. Contact an
                administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {canReadUsers && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registered users
                    </p>
                  </CardContent>
                </Card>
              )}

              {canReadPosts && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Posts
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPosts}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.publishedPosts} published, {stats.draftPosts} draft
                    </p>
                  </CardContent>
                </Card>
              )}

              {canReadRoles && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Roles
                    </CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRoles}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configured roles
                    </p>
                  </CardContent>
                </Card>
              )}

              {canReadPermissions && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Permissions
                    </CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalPermissions}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Available permissions
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              {(canReadUsers ||
                canReadPosts ||
                canReadRoles ||
                canReadPermissions) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Resource Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={resourceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {canReadPosts && stats.totalPosts > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Posts Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={postStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {postStatusData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Posts */}
            {canReadPosts && recentPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div
                        key={post._id}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div className="flex-1">
                          <Link
                            href={`/dashboard/posts/edit/${post.slug}`}
                            className="font-medium hover:underline"
                          >
                            {post.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            By {post.author_id?.name || "Unknown"} •{" "}
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.status === "published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Access */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {canManagePosts && (
                  <Link href="/dashboard/posts">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                          Posts
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Manage blog posts
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )}

                {canManageUsers && (
                  <Link href="/dashboard/users">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                          Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Manage users
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )}

                {canManageRoles && (
                  <Link href="/dashboard/roles">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                          Roles
                        </CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Manage roles
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )}

                {canManagePermissions && (
                  <Link href="/dashboard/permissions">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                          Permissions
                        </CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Manage permissions
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
