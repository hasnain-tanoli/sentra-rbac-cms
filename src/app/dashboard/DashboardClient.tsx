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

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading data...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <Card>
              <CardHeader>
                <CardTitle>Posts</CardTitle>
              </CardHeader>
              <CardContent>{posts.length}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>{users.length}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Roles</CardTitle>
              </CardHeader>
              <CardContent>{roles.length}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
              </CardHeader>
              <CardContent>{permissions.length}</CardContent>
            </Card>
          </div>

          <Card className="mb-10">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent>
                <Link
                  href="/dashboard/posts"
                  className="font-medium text-primary hover:underline"
                >
                  Manage Posts ({posts.length})
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Link
                  href="/dashboard/users"
                  className="font-medium text-primary hover:underline"
                >
                  Manage Users ({users.length})
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Link
                  href="/dashboard/roles"
                  className="font-medium text-primary hover:underline"
                >
                  Manage Roles ({roles.length})
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Link
                  href="/dashboard/permissions"
                  className="font-medium text-primary hover:underline"
                >
                  Manage Permissions ({permissions.length})
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
