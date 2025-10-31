"use client";

import { useEffect, useState } from "react";
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
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Role {
  _id: string;
  title: string;
  description?: string;
}

interface Permission {
  _id: string;
  resource: string;
  actions: string[];
  description?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch users + roles
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUsers, resRoles] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/roles"),
      ]);
      const usersData = await resUsers.json();
      const rolesData = await resRoles.json();

      if (usersData.success) setUsers(usersData.data);
      if (rolesData.success) setRoles(rolesData.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Assign role to user
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const res = await fetch("/api/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUser, role_id: selectedRole }),
      });

      // Try to parse JSON safely
      const text = await res.text();
      const data = text
        ? JSON.parse(text)
        : { success: false, message: "Empty response" };

      if (data.success) {
        await fetchData();
        setSelectedUser("");
        setSelectedRole("");
      } else {
        alert(data.message || "Failed to assign role");
      }
    } catch (err) {
      console.error("Error assigning role:", err);
      alert("Failed to assign role");
    }
  };

  // Delete user
  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });

      const text = await res.text();
      const data = text
        ? JSON.parse(text)
        : { success: false, message: "Empty response" };

      if (data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Server error deleting user");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <Link href="/dashboard/users/newUser">
          <Button>Create New User</Button>
        </Link>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-6">Assign Role to User</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <Select onValueChange={setSelectedUser} value={selectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setSelectedRole} value={selectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleAssignRole}>Assign</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground">No users found.</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.roles.map((r) => r.title).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      {[
                        ...new Set(user.permissions.map((p) => p.resource)),
                      ].join(", ") || "—"}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Link href={`/dashboard/users/edit/${user._id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
