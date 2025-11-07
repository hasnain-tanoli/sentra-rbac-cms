"use client";

import { useEffect, useState, useCallback } from "react";
import { Role } from "@/types/role";
import { User } from "@/types/user";
import { UserRole } from "@/types/userRole";
import { RolePermission } from "@/types/rolePermission";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pencil,
  Trash2,
  Plus,
  Users as UsersIcon,
  ShieldCheck,
  Loader2,
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<UserRole[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const { toast } = useToast();

  const fetchRoles = useCallback(async () => {
    try {
      console.log("Fetching roles...");
      const res = await fetch("/api/roles");
      const data = await res.json();
      console.log("Roles response:", data);
      if (data.success) {
        setRoles(data.data || []);
      } else {
        console.error("Failed to fetch roles:", data.message);
        toast({
          title: "Error",
          description: data.message || "Failed to fetch roles",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      console.log("Fetching users...");
      const res = await fetch("/api/users");
      const data = await res.json();
      console.log("Users response:", data);
      if (data.success) {
        setUsers(data.data || []);
      } else {
        console.error("Failed to fetch users:", data.message);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      console.log("Fetching assignments...");
      const res = await fetch("/api/user-roles");
      const data = await res.json();
      console.log("Assignments response:", data);
      if (data.success) {
        setAssignments(data.data || []);
      } else {
        console.error("Failed to fetch assignments:", data.message);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  }, []);

  const fetchRolePermissions = useCallback(async () => {
    try {
      console.log("Fetching role-permissions...");
      const res = await fetch("/api/role-permissions");
      const data = await res.json();
      console.log("Role-permissions response:", data);
      if (data.success) {
        setRolePermissions(data.data || []);
      } else {
        console.error("Failed to fetch role-permissions:", data.message);
      }
    } catch (err) {
      console.error("Error fetching role-permissions:", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          fetchRoles(),
          fetchUsers(),
          fetchAssignments(),
          fetchRolePermissions(),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [fetchRoles, fetchUsers, fetchAssignments, fetchRolePermissions]);

  const handleCreateRole = async () => {
    if (!newRoleTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Role title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newRoleTitle.trim(),
          description: newRoleDesc.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Role created successfully",
        });
        await fetchRoles();
        setCreateDialogOpen(false);
        setNewRoleTitle("");
        setNewRoleDesc("");
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error creating role:", err);
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (role: Role) => {
    if (!role?._id) {
      toast({
        title: "Error",
        description: "Invalid role selected",
        variant: "destructive",
      });
      return;
    }

    setEditingRole(role);
    setEditTitle(role.title);
    setEditDescription(role.description || "");
    setEditDialogOpen(true);
  };

  const handleEditRole = async () => {
    if (!editingRole?._id) {
      toast({
        title: "Error",
        description: "Invalid role selected",
        variant: "destructive",
      });
      return;
    }

    if (!editTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Role title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/roles/${editingRole._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
        await fetchRoles();
        setEditDialogOpen(false);
        setEditingRole(null);
        setEditTitle("");
        setEditDescription("");
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error updating role:", err);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (role: Role) => {
    if (!role?._id) {
      toast({
        title: "Error",
        description: "Invalid role selected",
        variant: "destructive",
      });
      return;
    }

    setDeletingRole(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!deletingRole?._id) {
      toast({
        title: "Error",
        description: "Invalid role selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/roles/${deletingRole._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Role deleted successfully",
        });
        await Promise.all([
          fetchRoles(),
          fetchAssignments(),
          fetchRolePermissions(),
        ]);
        setDeleteDialogOpen(false);
        setDeletingRole(null);
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting role:", err);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Validation Error",
        description: "Please select both user and role",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Assigning:", {
        user_id: selectedUser,
        role_id: selectedRole,
      });

      const res = await fetch("/api/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser,
          role_id: selectedRole,
        }),
      });

      const data = await res.json();
      console.log("Response:", data);

      if (data.success) {
        toast({
          title: "Success",
          description: "Role assigned to user successfully",
        });
        await fetchAssignments();
        setSelectedUser("");
        setSelectedRole("");
        setAssignDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to assign role",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error assigning role:", err);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAssignedUsers = (roleId: string) => {
    return assignments
      .filter(
        (a) =>
          a &&
          a.role_id &&
          a.role_id._id === roleId &&
          a.user_id &&
          a.user_id.name
      )
      .map((a) => a.user_id.name);
  };

  const getAssignedPermissions = (roleId: string) => {
    return rolePermissions
      .filter(
        (rp) =>
          rp &&
          rp.role_id &&
          rp.role_id._id === roleId &&
          rp.permission_id &&
          rp.permission_id.key
      )
      .map((rp) => rp.permission_id.key);
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading roles...</p>
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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              Roles Management
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage user roles and assign them to users
            </p>
          </div>
        </div>

        {/* Action Buttons - Responsive */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Create a new role with a title and optional description
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <Label htmlFor="role-title" className="text-sm sm:text-base">
                    Role Title *
                  </Label>
                  <Input
                    id="role-title"
                    placeholder="e.g., Content Manager"
                    value={newRoleTitle}
                    onChange={(e) => setNewRoleTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="role-description"
                    className="text-sm sm:text-base"
                  >
                    Description
                  </Label>
                  <Input
                    id="role-description"
                    placeholder="Describe the role's purpose (optional)"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setNewRoleTitle("");
                    setNewRoleDesc("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleCreateRole}
                  disabled={loading || !newRoleTitle.trim()}
                >
                  {loading ? "Creating..." : "Create Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <UsersIcon className="mr-2 h-4 w-4" />
                Assign Role to User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Assign Role to User</DialogTitle>
                <DialogDescription>
                  Select a user and role to assign
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <Label htmlFor="select-user" className="text-sm sm:text-base">
                    Select User *
                  </Label>
                  <Select onValueChange={setSelectedUser} value={selectedUser}>
                    <SelectTrigger id="select-user">
                      <SelectValue placeholder="Select User" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.length === 0 ? (
                        <div className="px-2 py-1 text-sm text-muted-foreground">
                          No users available
                        </div>
                      ) : (
                        users
                          .filter((user) => user && user._id)
                          .map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="select-role" className="text-sm sm:text-base">
                    Select Role *
                  </Label>
                  <Select onValueChange={setSelectedRole} value={selectedRole}>
                    <SelectTrigger id="select-role">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.length === 0 ? (
                        <div className="px-2 py-1 text-sm text-muted-foreground">
                          No roles available
                        </div>
                      ) : (
                        roles
                          .filter((role) => role && role._id)
                          .map((role) => (
                            <SelectItem key={role._id} value={role._id}>
                              {role.title}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setAssignDialogOpen(false);
                    setSelectedUser("");
                    setSelectedRole("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleAssignRole}
                  disabled={!selectedUser || !selectedRole || loading}
                >
                  {loading ? "Assigning..." : "Assign Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update the role&apos;s title and description
              </DialogDescription>
            </DialogHeader>
            {editingRole && (
              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <Label htmlFor="edit-title" className="text-sm sm:text-base">
                    Role Title *
                  </Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter role title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-desc" className="text-sm sm:text-base">
                    Description
                  </Label>
                  <Input
                    id="edit-desc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <Label className="text-sm sm:text-base">
                    Key (Auto-generated)
                  </Label>
                  <Input
                    value={editingRole.key}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingRole(null);
                  setEditTitle("");
                  setEditDescription("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleEditRole}
                disabled={loading || !editTitle.trim()}
              >
                {loading ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the role{" "}
                <strong className="text-foreground">
                  {deletingRole?.title}
                </strong>{" "}
                and remove it from all users that have it assigned.
                <br />
                <br />
                All permissions assigned to this role will also be removed.
                <br />
                <br />
                <span className="text-destructive font-medium">
                  This action cannot be undone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel
                className="w-full sm:w-auto"
                disabled={loading}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteRole}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Role"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Role
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Key
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Description
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Users
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Permissions
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-2">No roles found</p>
                      <p className="text-sm">
                        Create your first role to get started
                      </p>
                    </td>
                  </tr>
                ) : (
                  roles
                    .filter((role) => role && role._id)
                    .map((role) => {
                      const assignedUsers = getAssignedUsers(role._id);
                      const assignedPermissions = getAssignedPermissions(
                        role._id
                      );

                      return (
                        <tr
                          key={role._id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="border-b px-4 py-3 font-medium">
                            {role.title}
                          </td>
                          <td className="border-b px-4 py-3">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {role.key}
                            </code>
                          </td>
                          <td className="border-b px-4 py-3 text-sm text-muted-foreground">
                            {role.description || "—"}
                          </td>
                          <td className="border-b px-4 py-3">
                            {assignedUsers.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {assignedUsers
                                  .slice(0, 3)
                                  .map((userName, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                                    >
                                      {userName}
                                    </span>
                                  ))}
                                {assignedUsers.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                                    +{assignedUsers.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </td>
                          <td className="border-b px-4 py-3">
                            {assignedPermissions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {assignedPermissions
                                  .slice(0, 2)
                                  .map((perm, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium"
                                    >
                                      {perm}
                                    </span>
                                  ))}
                                {assignedPermissions.length > 2 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                                    +{assignedPermissions.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </td>
                          <td className="border-b px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(role)}
                                title="Edit role"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(role)}
                                title="Delete role"
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {roles.length === 0 ? (
            <div className="rounded-md border">
              <div className="px-4 py-12 text-center text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">No roles found</p>
                <p className="text-sm">Create your first role to get started</p>
              </div>
            </div>
          ) : (
            roles
              .filter((role) => role && role._id)
              .map((role) => {
                const assignedUsers = getAssignedUsers(role._id);
                const assignedPermissions = getAssignedPermissions(role._id);

                return (
                  <div
                    key={role._id}
                    className="rounded-md border p-4 space-y-3 bg-card hover:bg-muted/30 transition-colors"
                  >
                    {/* Role Title & Key */}
                    <div>
                      <h3 className="font-semibold text-base mb-1">
                        {role.title}
                      </h3>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                        {role.key}
                      </code>
                    </div>

                    {/* Description */}
                    {role.description && (
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    )}

                    {/* Users */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <UsersIcon className="h-3.5 w-3.5" />
                        Assigned Users
                      </p>
                      {assignedUsers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedUsers.map((userName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                            >
                              {userName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No users assigned
                        </span>
                      )}
                    </div>

                    {/* Permissions */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Key className="h-3.5 w-3.5" />
                        Permissions
                      </p>
                      {assignedPermissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedPermissions.map((perm, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No permissions assigned
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(role)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openDeleteDialog(role)}
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
        {roles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-md border bg-muted/30">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Roles
              </p>
              <p className="text-lg sm:text-xl font-bold">{roles.length}</p>
            </div>
            <div className="text-center sm:border-x">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Users
              </p>
              <p className="text-lg sm:text-xl font-bold">{users.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Assignments
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {assignments.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
