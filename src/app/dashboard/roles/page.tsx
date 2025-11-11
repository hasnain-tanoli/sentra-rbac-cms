"use client";

import { useEffect, useState, useCallback } from "react";
import { Role } from "@/types/role";
import { User } from "@/types/user";
import { UserRole } from "@/types/userRole";
import { RolePermission } from "@/types/rolePermission";
import { Permission } from "@/types/permission";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pencil,
  Trash2,
  Plus,
  Users as UsersIcon,
  ShieldCheck,
  Loader2,
  Key,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignments, setAssignments] = useState<UserRole[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSelectedPermissions, setEditSelectedPermissions] = useState<
    string[]
  >([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const { toast } = useToast();

  const formatPermissionName = (perm: Permission): string => {
    const action = perm.action.charAt(0).toUpperCase() + perm.action.slice(1);
    const resource =
      perm.resource.charAt(0).toUpperCase() + perm.resource.slice(1);
    return `${action} ${resource}`;
  };

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.success) {
        setRoles(data.data || []);
      } else {
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
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/permissions");
      const data = await res.json();
      if (data.success) {
        setPermissions(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch("/api/user-roles");
      const data = await res.json();
      if (data.success) {
        setAssignments(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  }, []);

  const fetchRolePermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/role-permissions");
      const data = await res.json();
      if (data.success) {
        setRolePermissions(data.data || []);
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
          fetchPermissions(),
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
  }, [
    fetchRoles,
    fetchUsers,
    fetchPermissions,
    fetchAssignments,
    fetchRolePermissions,
  ]);

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
        const newRoleId = data.data._id;

        if (selectedPermissions.length > 0) {
          const permissionKeys = selectedPermissions
            .map((permId) => {
              const perm = permissions.find((p) => p._id === permId);
              return perm?.key;
            })
            .filter(Boolean);

          const permRes = await fetch("/api/role-permissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role_id: newRoleId,
              permission_keys: permissionKeys,
            }),
          });

          const permData = await permRes.json();

          if (permData.success) {
            toast({
              title: "Success",
              description: `Role created with ${permData.data.assignedCount} permission(s)`,
            });
          } else {
            toast({
              title: "Partial Success",
              description: `Role created but failed to assign permissions: ${permData.message}`,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Success",
            description: "Role created successfully",
          });
        }

        await Promise.all([fetchRoles(), fetchRolePermissions()]);
        setCreateDialogOpen(false);
        setNewRoleTitle("");
        setNewRoleDesc("");
        setSelectedPermissions([]);
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

  const openEditDialog = async (role: Role) => {
    if (!role?._id) {
      toast({
        title: "Error",
        description: "Invalid role selected",
        variant: "destructive",
      });
      return;
    }

    if (role.is_system) {
      toast({
        title: "Cannot Edit",
        description:
          "System roles cannot be edited as they are required for core functionality.",
        variant: "destructive",
      });
      return;
    }

    setEditingRole(role);
    setEditTitle(role.title);
    setEditDescription(role.description || "");

    const currentPermissions = rolePermissions
      .filter((rp) => rp.role_id && rp.role_id._id === role._id)
      .map((rp) => rp.permission_id._id);

    setEditSelectedPermissions(currentPermissions);
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
        const currentRolePerms = rolePermissions.filter(
          (rp) => rp.role_id && rp.role_id._id === editingRole._id
        );

        const currentPermIds = currentRolePerms.map(
          (rp) => rp.permission_id._id
        );

        const toAdd = editSelectedPermissions.filter(
          (permId) => !currentPermIds.includes(permId)
        );

        const toRemove = currentRolePerms.filter(
          (rp) => !editSelectedPermissions.includes(rp.permission_id._id)
        );

        if (toAdd.length > 0) {
          const permissionKeys = toAdd
            .map((permId) => {
              const perm = permissions.find((p) => p._id === permId);
              return perm?.key;
            })
            .filter(Boolean);

          await fetch("/api/role-permissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role_id: editingRole._id,
              permission_keys: permissionKeys,
            }),
          });
        }

        if (toRemove.length > 0) {
          await Promise.all(
            toRemove.map((rp) =>
              fetch("/api/role-permissions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  role_id: editingRole._id,
                  permission_id: rp.permission_id._id,
                }),
              })
            )
          );
        }

        toast({
          title: "Success",
          description: "Role updated successfully",
        });

        await Promise.all([fetchRoles(), fetchRolePermissions()]);
        setEditDialogOpen(false);
        setEditingRole(null);
        setEditTitle("");
        setEditDescription("");
        setEditSelectedPermissions([]);
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

    if (role.is_system) {
      toast({
        title: "Cannot Delete",
        description:
          "System roles cannot be deleted as they are required for core functionality.",
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

  const togglePermission = (permissionId: string, isEdit = false) => {
    if (isEdit) {
      setEditSelectedPermissions((prev) =>
        prev.includes(permissionId)
          ? prev.filter((id) => id !== permissionId)
          : [...prev, permissionId]
      );
    } else {
      setSelectedPermissions((prev) =>
        prev.includes(permissionId)
          ? prev.filter((id) => id !== permissionId)
          : [...prev, permissionId]
      );
    }
  };

  const selectAllPermissions = (isEdit = false) => {
    const allPermIds = permissions.map((p) => p._id);
    if (isEdit) {
      setEditSelectedPermissions(allPermIds);
    } else {
      setSelectedPermissions(allPermIds);
    }
  };

  const deselectAllPermissions = (isEdit = false) => {
    if (isEdit) {
      setEditSelectedPermissions([]);
    } else {
      setSelectedPermissions([]);
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

  const PermissionSelector = ({
    selectedPerms,
    isEdit = false,
  }: {
    selectedPerms: string[];
    isEdit?: boolean;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Permissions</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => selectAllPermissions(isEdit)}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => deselectAllPermissions(isEdit)}
          >
            Deselect All
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-3">
          {permissions.map((perm) => (
            <div
              key={perm._id}
              className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                togglePermission(perm._id, isEdit);
              }}
            >
              <Checkbox
                id={`${isEdit ? "edit-" : ""}perm-${perm._id}`}
                checked={selectedPerms.includes(perm._id)}
                onCheckedChange={() => togglePermission(perm._id, isEdit)}
                className="mt-1 pointer-events-none"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {formatPermissionName(perm)}
                    </span>
                    {perm.description && (
                      <span className="text-xs text-muted-foreground">
                        {perm.description}
                      </span>
                    )}
                    <code className="text-xs bg-muted px-2 py-0.5 rounded w-fit">
                      {perm.key}
                    </code>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs capitalize whitespace-nowrap"
                  >
                    {perm.resource}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <p className="text-sm text-muted-foreground">
        Selected: {selectedPerms.length} of {permissions.length} permissions
      </p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              Roles Management
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage user roles and assign permissions
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Create a new role with permissions
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <Label htmlFor="role-title">Role Title *</Label>
                  <Input
                    id="role-title"
                    placeholder="e.g., Content Manager"
                    value={newRoleTitle}
                    onChange={(e) => setNewRoleTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role-description">Description</Label>
                  <Input
                    id="role-description"
                    placeholder="Describe the role's purpose"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                  />
                </div>
                <PermissionSelector selectedPerms={selectedPermissions} />
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setNewRoleTitle("");
                    setNewRoleDesc("");
                    setSelectedPermissions([]);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRole}
                  disabled={loading || !newRoleTitle.trim()}
                >
                  {loading ? "Creating..." : "Create Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update role details and permissions
              </DialogDescription>
            </DialogHeader>
            {editingRole && (
              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <Label htmlFor="edit-title">Role Title *</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-desc">Description</Label>
                  <Input
                    id="edit-desc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <PermissionSelector
                  selectedPerms={editSelectedPermissions}
                  isEdit={true}
                />
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingRole(null);
                  setEditTitle("");
                  setEditDescription("");
                  setEditSelectedPermissions([]);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleEditRole} disabled={loading}>
                {loading ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteRole}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Role"}
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
                          <td className="border-b px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{role.title}</span>
                              {role.is_system && (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  System
                                </Badge>
                              )}
                            </div>
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
                                disabled={role.is_system}
                                title={
                                  role.is_system
                                    ? "System roles cannot be edited"
                                    : "Edit role"
                                }
                              >
                                <Pencil
                                  className={`h-4 w-4 ${
                                    role.is_system
                                      ? "text-muted-foreground"
                                      : ""
                                  }`}
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(role)}
                                disabled={role.is_system}
                                title={
                                  role.is_system
                                    ? "System roles cannot be deleted"
                                    : "Delete role"
                                }
                              >
                                <Trash2
                                  className={`h-4 w-4 ${
                                    role.is_system
                                      ? "text-muted-foreground"
                                      : "text-destructive"
                                  }`}
                                />
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
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-base">
                          {role.title}
                        </h3>
                        {role.is_system && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            System
                          </Badge>
                        )}
                      </div>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                        {role.key}
                      </code>
                    </div>

                    {role.description && (
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    )}

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

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(role)}
                        disabled={role.is_system}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        {role.is_system ? "Protected" : "Edit"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openDeleteDialog(role)}
                        disabled={role.is_system}
                      >
                        <Trash2
                          className={`h-4 w-4 mr-2 ${
                            role.is_system
                              ? "text-muted-foreground"
                              : "text-destructive"
                          }`}
                        />
                        {role.is_system ? "Protected" : "Delete"}
                      </Button>
                    </div>
                  </div>
                );
              })
          )}
        </div>

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
