"use client";

import { useEffect, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
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

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

const StatCard = memo(
  ({
    title,
    value,
    subtitle,
    icon: Icon,
  }: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ElementType;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
);
StatCard.displayName = "StatCard";

const ResourceChart = memo(
  ({ data }: { data: Array<{ name: string; value: number }> }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Resource Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
);
ResourceChart.displayName = "ResourceChart";

const PostStatusChart = memo(
  ({ data }: { data: Array<{ name: string; value: number }> }) => (
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
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {data.map((_, index) => (
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
  )
);
PostStatusChart.displayName = "PostStatusChart";

const RecentPostItem = memo(({ post }: { post: Post }) => (
  <div className="flex items-center justify-between border-b pb-3 last:border-0">
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
));
RecentPostItem.displayName = "RecentPostItem";

const RecentPostsList = memo(({ posts }: { posts: Post[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Posts</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {posts.map((post) => (
          <RecentPostItem key={post._id} post={post} />
        ))}
      </div>
    </CardContent>
  </Card>
));
RecentPostsList.displayName = "RecentPostsList";

const QuickAccessCard = memo(
  ({
    href,
    title,
    description,
    icon: Icon,
  }: {
    href: string;
    title: string;
    description: string;
    icon: React.ElementType;
  }) => (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
);
QuickAccessCard.displayName = "QuickAccessCard";

const EmptyState = memo(() => (
  <Card>
    <CardContent className="py-12 text-center">
      <p className="text-muted-foreground">
        You don&apos;t have any permissions assigned yet. Contact an
        administrator.
      </p>
    </CardContent>
  </Card>
));
EmptyState.displayName = "EmptyState";

const LoadingState = memo(({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-3 text-muted-foreground">{message}</span>
  </div>
));
LoadingState.displayName = "LoadingState";

export default function DashboardPage() {
  const router = useRouter();
  const {
    permissions,
    loading: permsLoading,
    hasPermission,
  } = usePermissions();

  const canReadUsers = useMemo(
    () => hasPermission(PERMISSION_KEYS.USERS_READ),
    [hasPermission]
  );

  const canReadPosts = useMemo(
    () => hasPermission(PERMISSION_KEYS.POSTS_READ),
    [hasPermission]
  );

  const canReadRoles = useMemo(
    () => hasPermission(PERMISSION_KEYS.ROLES_READ),
    [hasPermission]
  );

  const canReadPermissions = useMemo(
    () => hasPermission(PERMISSION_KEYS.PERMISSIONS_READ),
    [hasPermission]
  );

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

  const hasOnlyPostsRead = useMemo(() => {
    return (
      permissions.length === 1 && permissions[0] === PERMISSION_KEYS.POSTS_READ
    );
  }, [permissions]);

  const hasDashboardAccess = useMemo(() => {
    return (
      canManageUsers || canManageRoles || canManagePermissions || canManagePosts
    );
  }, [canManageUsers, canManageRoles, canManagePermissions, canManagePosts]);

  const nothingToShow = useMemo(
    () => !permsLoading && permissions.length === 0,
    [permsLoading, permissions.length]
  );

  const { data: usersData } = useSWR<ApiResponse<unknown[]>>(
    canReadUsers ? "/api/users" : null
  );

  const { data: postsData } = useSWR<ApiResponse<Post[]>>(
    canReadPosts ? "/api/posts" : null
  );

  const { data: rolesData } = useSWR<ApiResponse<unknown[]>>(
    canReadRoles ? "/api/roles" : null
  );

  const { data: permissionsData } = useSWR<ApiResponse<unknown[]>>(
    canReadPermissions ? "/api/permissions" : null
  );

  const users = useMemo(() => usersData?.data || [], [usersData?.data]);
  const posts = useMemo(() => postsData?.data || [], [postsData?.data]);
  const roles = useMemo(() => rolesData?.data || [], [rolesData?.data]);
  const permissionsCount = useMemo(
    () => permissionsData?.data || [],
    [permissionsData?.data]
  );

  const stats = useMemo(() => {
    const published = posts.filter((p) => p.status === "published").length;
    const draft = posts.filter((p) => p.status === "draft").length;

    return {
      totalUsers: users.length,
      totalPosts: posts.length,
      totalRoles: roles.length,
      totalPermissions: permissionsCount.length,
      publishedPosts: published,
      draftPosts: draft,
    };
  }, [users.length, posts, roles.length, permissionsCount.length]);

  const recentPosts = useMemo(() => posts.slice(0, 5), [posts]);

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

  const isDataLoading = useMemo(() => {
    return (
      (canReadUsers && !usersData) ||
      (canReadPosts && !postsData) ||
      (canReadRoles && !rolesData) ||
      (canReadPermissions && !permissionsData)
    );
  }, [
    canReadUsers,
    usersData,
    canReadPosts,
    postsData,
    canReadRoles,
    rolesData,
    canReadPermissions,
    permissionsData,
  ]);

  const showCharts = useMemo(
    () => canReadUsers || canReadPosts || canReadRoles || canReadPermissions,
    [canReadUsers, canReadPosts, canReadRoles, canReadPermissions]
  );

  const handleRedirect = useCallback(() => {
    router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!permsLoading && (hasOnlyPostsRead || !hasDashboardAccess)) {
      handleRedirect();
    }
  }, [permsLoading, hasOnlyPostsRead, hasDashboardAccess, handleRedirect]);

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

        {isDataLoading ? (
          <LoadingState message="Loading dashboard..." />
        ) : nothingToShow ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {canReadUsers && (
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  subtitle="Registered users"
                  icon={Users}
                />
              )}

              {canReadPosts && (
                <StatCard
                  title="Total Posts"
                  value={stats.totalPosts}
                  subtitle={`${stats.publishedPosts} published, ${stats.draftPosts} draft`}
                  icon={FileText}
                />
              )}

              {canReadRoles && (
                <StatCard
                  title="Total Roles"
                  value={stats.totalRoles}
                  subtitle="Configured roles"
                  icon={Shield}
                />
              )}

              {canReadPermissions && (
                <StatCard
                  title="Total Permissions"
                  value={stats.totalPermissions}
                  subtitle="Available permissions"
                  icon={Settings}
                />
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {showCharts && <ResourceChart data={resourceData} />}

              {canReadPosts && stats.totalPosts > 0 && (
                <PostStatusChart data={postStatusData} />
              )}
            </div>

            {canReadPosts && recentPosts.length > 0 && (
              <RecentPostsList posts={recentPosts} />
            )}

            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {canManagePosts && (
                  <QuickAccessCard
                    href="/dashboard/posts"
                    title="Posts"
                    description="Manage blog posts"
                    icon={FileText}
                  />
                )}

                {canManageUsers && (
                  <QuickAccessCard
                    href="/dashboard/users"
                    title="Users"
                    description="Manage users"
                    icon={Users}
                  />
                )}

                {canManageRoles && (
                  <QuickAccessCard
                    href="/dashboard/roles"
                    title="Roles"
                    description="Manage roles"
                    icon={Shield}
                  />
                )}

                {canManagePermissions && (
                  <QuickAccessCard
                    href="/dashboard/permissions"
                    title="Permissions"
                    description="Manage permissions"
                    icon={Settings}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
