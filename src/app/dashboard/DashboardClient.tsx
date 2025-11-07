"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import {
  FileText,
  Users,
  ShieldCheck,
  Key,
  TrendingUp,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermission";
import { PERMISSION_KEYS } from "@/lib/constants/permissions";

interface Post {
  _id: string;
  title: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  roles: { title: string }[];
  permissions: { resource: string; actions: string[] }[];
}

interface Role {
  _id: string;
  title: string;
}

interface Permission {
  _id: string;
  resource: string;
  actions: string[];
}

export function DashboardClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const { hasPermission, loading: permsLoading } = usePermissions();

  // Check individual permissions
  const canReadPosts = hasPermission(PERMISSION_KEYS.POSTS_READ);
  const canReadUsers = hasPermission(PERMISSION_KEYS.USERS_READ);
  const canReadRoles = hasPermission(PERMISSION_KEYS.ROLES_READ);
  const canReadPermissions = hasPermission(PERMISSION_KEYS.PERMISSIONS_READ);

  const canManagePosts =
    hasPermission(PERMISSION_KEYS.POSTS_CREATE) ||
    hasPermission(PERMISSION_KEYS.POSTS_UPDATE) ||
    hasPermission(PERMISSION_KEYS.POSTS_DELETE);

  const canManageUsers =
    hasPermission(PERMISSION_KEYS.USERS_CREATE) ||
    hasPermission(PERMISSION_KEYS.USERS_READ) ||
    hasPermission(PERMISSION_KEYS.USERS_UPDATE) ||
    hasPermission(PERMISSION_KEYS.USERS_DELETE);

  const canManageRoles =
    hasPermission(PERMISSION_KEYS.ROLES_CREATE) ||
    hasPermission(PERMISSION_KEYS.ROLES_READ) ||
    hasPermission(PERMISSION_KEYS.ROLES_UPDATE) ||
    hasPermission(PERMISSION_KEYS.ROLES_DELETE);

  const canManagePermissions =
    hasPermission(PERMISSION_KEYS.PERMISSIONS_CREATE) ||
    hasPermission(PERMISSION_KEYS.PERMISSIONS_READ) ||
    hasPermission(PERMISSION_KEYS.PERMISSIONS_UPDATE) ||
    hasPermission(PERMISSION_KEYS.PERMISSIONS_DELETE);

  useEffect(() => {
    async function fetchData() {
      if (permsLoading) return;

      try {
        const promises: Promise<Response>[] = [];
        const fetchFlags = {
          posts: false,
          users: false,
          roles: false,
          permissions: false,
        };

        // Only fetch data for resources user can read
        if (canReadPosts) {
          promises.push(fetch("/api/posts"));
          fetchFlags.posts = true;
        }
        if (canReadUsers) {
          promises.push(fetch("/api/users"));
          fetchFlags.users = true;
        }
        if (canReadRoles) {
          promises.push(fetch("/api/roles"));
          fetchFlags.roles = true;
        }
        if (canReadPermissions) {
          promises.push(fetch("/api/permissions"));
          fetchFlags.permissions = true;
        }

        if (promises.length === 0) {
          setLoading(false);
          return;
        }

        const responses = await Promise.all(promises);
        const jsonPromises = responses.map((r) => r.json());
        const results = await Promise.all(jsonPromises);

        let resultIndex = 0;

        if (fetchFlags.posts && results[resultIndex]?.success) {
          setPosts(results[resultIndex].data || []);
          resultIndex++;
        }
        if (fetchFlags.users && results[resultIndex]?.success) {
          setUsers(results[resultIndex].data || []);
          resultIndex++;
        }
        if (fetchFlags.roles && results[resultIndex]?.success) {
          setRoles(results[resultIndex].data || []);
          resultIndex++;
        }
        if (fetchFlags.permissions && results[resultIndex]?.success) {
          setPermissions(results[resultIndex].data || []);
          resultIndex++;
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [
    permsLoading,
    canReadPosts,
    canReadUsers,
    canReadRoles,
    canReadPermissions,
  ]);

  // Filter stats based on permissions
  const stats = [
    canReadPosts && {
      title: "Posts",
      value: posts.length,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      href: "/dashboard/posts",
      canManage: canManagePosts,
    },
    canReadUsers && {
      title: "Users",
      value: users.length,
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      href: "/dashboard/users",
      canManage: canManageUsers,
    },
    canReadRoles && {
      title: "Roles",
      value: roles.length,
      icon: ShieldCheck,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      href: "/dashboard/roles",
      canManage: canManageRoles,
    },
    canReadPermissions && {
      title: "Permissions",
      value: permissions.length,
      icon: Key,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      href: "/dashboard/permissions",
      canManage: canManagePermissions,
    },
  ].filter(Boolean) as Array<{
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    href: string;
    canManage: boolean;
  }>;

  const chartData = [
    canReadPosts && { name: "Posts", value: posts.length },
    canReadUsers && { name: "Users", value: users.length },
    canReadRoles && { name: "Roles", value: roles.length },
    canReadPermissions && { name: "Permissions", value: permissions.length },
  ].filter(Boolean) as Array<{ name: string; value: number }>;

  const isLoading = loading || permsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header - Responsive */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Overview of your application&apos;s data and statistics
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        ) : stats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No data available. You may not have the necessary permissions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat) => (
                <Card
                  key={stat.title}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total {stat.title.toLowerCase()} in system
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart Card - Responsive */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg sm:text-xl">
                      System Overview
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Visual representation of your data
                  </p>
                </CardHeader>
                <CardContent className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions - Responsive */}
            {stats.filter((stat) => stat.canManage).length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {stats
                    .filter((stat) => stat.canManage)
                    .map((stat) => (
                      <Link key={stat.title} href={stat.href}>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg ${stat.bgColor}`}
                                >
                                  <stat.icon
                                    className={`h-5 w-5 ${stat.color}`}
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-sm sm:text-base">
                                    Manage {stat.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {stat.value} total
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
