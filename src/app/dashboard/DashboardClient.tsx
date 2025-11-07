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

  useEffect(() => {
    async function fetchData() {
      try {
        const [postsRes, usersRes, rolesRes, permissionsRes] =
          await Promise.all([
            fetch("/api/posts").then((r) => r.json()),
            fetch("/api/users").then((r) => r.json()),
            fetch("/api/roles").then((r) => r.json()),
            fetch("/api/permissions").then((r) => r.json()),
          ]);

        if (postsRes.success) setPosts(postsRes.data);
        if (usersRes.success) setUsers(usersRes.data);
        if (rolesRes.success) setRoles(rolesRes.data);
        if (permissionsRes.success) setPermissions(permissionsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const chartData = [
    { name: "Posts", value: posts.length },
    { name: "Users", value: users.length },
    { name: "Roles", value: roles.length },
    { name: "Permissions", value: permissions.length },
  ];

  const stats = [
    {
      title: "Posts",
      value: posts.length,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      href: "/dashboard/posts",
    },
    {
      title: "Users",
      value: users.length,
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      href: "/dashboard/users",
    },
    {
      title: "Roles",
      value: roles.length,
      icon: ShieldCheck,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      href: "/dashboard/roles",
    },
    {
      title: "Permissions",
      value: permissions.length,
      icon: Key,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      href: "/dashboard/permissions",
    },
  ];

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

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
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

            {/* Quick Actions - Responsive */}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.map((stat) => (
                  <Link key={stat.title} href={stat.href}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                              <stat.icon className={`h-5 w-5 ${stat.color}`} />
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
