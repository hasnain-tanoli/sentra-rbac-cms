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
import { Loader2 } from "lucide-react";

interface Role {
  _id: string;
  title: string;
  key: string;
  description?: string;
}

interface Permission {
  _id: string;
  resource: string;
  action: string;
  key: string;
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
  const [assigning, setAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUsers, resRoles] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/roles"),
      ]);

      const usersData = await resUsers.json();
      const rolesData = await resRoles.json();

      if (usersData.success) setUsers(usersData.data || []);
      if (rolesData.success) setRoles(rolesData.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      alert("Failed to load users and roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      alert("Please select both a user and a role");
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch("/api/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser,
          role_keys: [roles.find((r) => r._id === selectedRole)?.key || ""],
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        alert(`Role assigned successfully!`);
        await fetchData();
        setSelectedUser("");
        setSelectedRole("");
        setDialogOpen(false);
      } else {
        alert(data.message || "Failed to assign role");
      }
    } catch (err) {
      console.error("Error assigning role:", err);
      alert("Failed to assign role. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        alert("User deleted successfully");
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-6">Assign Role to User</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select User
              </label>
              <Select
                onValueChange={setSelectedUser}
                value={selectedUser}
                disabled={assigning}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user) => user && user._id)
                    .map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Role
              </label>
              <Select
                onValueChange={setSelectedRole}
                value={selectedRole}
                disabled={assigning}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role && role._id)
                    .map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.title}
                        {role.description && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({role.description})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={assigning}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignRole}
                disabled={!selectedUser || !selectedRole || assigning}
                className="flex-1"
              >
                {assigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Role"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No users found.</p>
            <Link href="/dashboard/users/newUser">
              <Button>Create Your First User</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users
                  .filter((user) => user && user._id)
                  .map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {(() => {
                          if (
                            !user.roles ||
                            !Array.isArray(user.roles) ||
                            user.roles.length === 0
                          ) {
                            return (
                              <span className="text-muted-foreground text-sm">
                                No roles
                              </span>
                            );
                          }

                          const validRoles = user.roles
                            .filter((role) => {
                              if (!role || !role.title) {
                                return false;
                              }
                              return true;
                            })
                            .filter((role, index, self) => {
                              return (
                                index ===
                                self.findIndex((r) => r.title === role.title)
                              );
                            });

                          return (
                            <div className="flex flex-wrap gap-1">
                              {validRoles.map((role, index) => (
                                <span
                                  key={`user-${user._id}-role-idx-${index}`}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                                >
                                  {role.title}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {user.permissions && user.permissions.length > 0 ? (
                          <div className="text-sm">
                            {(() => {
                              const validPermissions = user.permissions.filter(
                                (p) => p && p._id && p.resource && p.action
                              );

                              const uniquePermissions = validPermissions.filter(
                                (permission, index, self) =>
                                  index ===
                                  self.findIndex(
                                    (p) =>
                                      p.resource === permission.resource &&
                                      p.action === permission.action
                                  )
                              );

                              const resourceMap = uniquePermissions.reduce(
                                (acc, p) => {
                                  if (!acc[p.resource]) {
                                    acc[p.resource] = new Set<string>();
                                  }
                                  acc[p.resource].add(p.action);
                                  return acc;
                                },
                                {} as Record<string, Set<string>>
                              );

                              return Object.entries(resourceMap).map(
                                ([resource, actionsSet]) => (
                                  <span
                                    key={`${user._id}-perm-${resource}`}
                                    className="inline-block mr-2 mb-1 text-xs"
                                  >
                                    <span className="font-medium">
                                      {resource}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {" "}
                                      ({actionsSet.size})
                                    </span>
                                  </span>
                                )
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No permissions
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
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
                        </div>
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
