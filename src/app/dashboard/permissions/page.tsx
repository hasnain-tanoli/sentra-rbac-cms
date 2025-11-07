"use client";

import { useEffect, useState, useCallback } from "react";
import { Permission } from "@/types/permission";
import { Role } from "@/types/role";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Pencil, Trash2, Plus, Shield, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<RolePermission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [availableResources, setAvailableResources] = useState<string[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({
    resource: "",
    action: "",
    description: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );
  const [editDescription, setEditDescription] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPermission, setDeletingPermission] =
    useState<Permission | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { toast } = useToast();

  const fetchPermissionSchema = useCallback(async () => {
    try {
      const res = await fetch("/api/permissions?schema=true");
      const data = await res.json();
      if (data.success && data.data) {
        setAvailableActions(data.data.actions || []);
        setAvailableResources(data.data.resources || []);
      }
    } catch (err) {
      console.error("Error fetching permission schema:", err);
      toast({
        title: "Error",
        description: "Failed to fetch permission schema",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/permissions");
      const data = await res.json();
      if (data.success) {
        setPermissions(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
      toast({
        title: "Error",
        description: "Failed to fetch permissions",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.success) {
        setRoles(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch("/api/role-permissions");
      const data = await res.json();
      if (data.success) {
        setAssignments(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching role-permissions:", err);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      await fetchPermissionSchema();
      await fetchPermissions();
      await fetchRoles();
      await fetchAssignments();
    }
    loadData();
  }, [fetchPermissionSchema, fetchPermissions, fetchRoles, fetchAssignments]);

  // Create Permission
  const handleCreatePermission = async () => {
    if (!newPermission.resource || !newPermission.action) {
      toast({
        title: "Validation Error",
        description: "Resource and action are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPermission),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Permission created successfully",
        });
        await fetchPermissions();
        setCreateDialogOpen(false);
        setNewPermission({ resource: "", action: "", description: "" });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error creating permission:", err);
      toast({
        title: "Error",
        description: "Failed to create permission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (permission: Permission) => {
    if (!permission?._id) {
      toast({
        title: "Error",
        description: "Invalid permission selected",
        variant: "destructive",
      });
      return;
    }
    setEditingPermission(permission);
    setEditDescription(permission.description || "");
    setEditDialogOpen(true);
  };

  const handleEditPermission = async () => {
    if (!editingPermission?._id) {
      toast({
        title: "Error",
        description: "Invalid permission selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/permissions/${editingPermission._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Permission updated successfully",
        });
        await fetchPermissions();
        setEditDialogOpen(false);
        setEditingPermission(null);
        setEditDescription("");
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error updating permission:", err);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (permission: Permission) => {
    if (!permission?._id) {
      toast({
        title: "Error",
        description: "Invalid permission selected",
        variant: "destructive",
      });
      return;
    }
    setDeletingPermission(permission);
    setDeleteDialogOpen(true);
  };

  const handleDeletePermission = async () => {
    if (!deletingPermission?._id) {
      toast({
        title: "Error",
        description: "Invalid permission selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/permissions/${deletingPermission._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Permission deleted successfully",
        });
        await fetchPermissions();
        await fetchAssignments();
        setDeleteDialogOpen(false);
        setDeletingPermission(null);
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting permission:", err);
      toast({
        title: "Error",
        description: "Failed to delete permission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPermissions = async () => {
    if (!selectedRole || selectedPermissions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a role and at least one permission",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/role-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: selectedRole,
          permission_keys: selectedPermissions,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `${data.data.assignedCount} permission(s) assigned successfully`,
        });
        await fetchAssignments();
        setSelectedPermissions([]);
        setSelectedRole("");
        setAssignDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error assigning permissions:", err);
      toast({
        title: "Error",
        description: "Failed to assign permissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey)
        ? prev.filter((k) => k !== permKey)
        : [...prev, permKey]
    );
  };

  const getAssignedRoles = (permissionId: string) => {
    return assignments
      .filter(
        (a) =>
          a &&
          a.permission_id &&
          a.permission_id._id === permissionId &&
          a.role_id &&
          a.role_id.title
      )
      .map((a) => a.role_id.title);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              Permissions Management
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage system permissions and assign them to roles
            </p>
          </div>
        </div>

        {/* Action Buttons - Responsive */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Permission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Permission</DialogTitle>
                <DialogDescription>
                  Create a new permission by selecting a resource and action
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <Label htmlFor="resource" className="text-sm sm:text-base">
                    Resource *
                  </Label>
                  <Select
                    value={newPermission.resource}
                    onValueChange={(value) =>
                      setNewPermission({ ...newPermission, resource: value })
                    }
                  >
                    <SelectTrigger id="resource">
                      <SelectValue placeholder="Select Resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableResources.map((resource) => (
                        <SelectItem key={resource} value={resource}>
                          <span className="capitalize">{resource}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="action" className="text-sm sm:text-base">
                    Action *
                  </Label>
                  <Select
                    value={newPermission.action}
                    onValueChange={(value) =>
                      setNewPermission({ ...newPermission, action: value })
                    }
                  >
                    <SelectTrigger id="action">
                      <SelectValue placeholder="Select Action" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableActions.map((action) => (
                        <SelectItem key={action} value={action}>
                          <span className="capitalize">{action}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm sm:text-base">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={newPermission.description}
                    onChange={(e) =>
                      setNewPermission({
                        ...newPermission,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter description (optional)"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setNewPermission({
                      resource: "",
                      action: "",
                      description: "",
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleCreatePermission}
                  disabled={
                    loading || !newPermission.resource || !newPermission.action
                  }
                >
                  {loading ? "Creating..." : "Create Permission"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Shield className="mr-2 h-4 w-4" />
                Assign Permissions to Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Assign Permissions to Role</DialogTitle>
                <DialogDescription>
                  Select a role and permissions to assign
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <Label htmlFor="select-role" className="text-sm sm:text-base">
                    Select Role *
                  </Label>
                  <Select onValueChange={setSelectedRole} value={selectedRole}>
                    <SelectTrigger id="select-role">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((role) => role && role._id)
                        .map((role) => (
                          <SelectItem key={role._id} value={role._id}>
                            {role.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                  <p className="text-xs sm:text-sm font-medium mb-3">
                    Select Permissions ({selectedPermissions.length} selected):
                  </p>
                  {permissions.length === 0 ? (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                      No permissions available. Create permissions first.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {permissions
                        .filter((perm) => perm && perm._id && perm.key)
                        .map((perm) => (
                          <label
                            key={perm._id}
                            className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 px-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                              className="rounded"
                            />
                            <span className="text-xs sm:text-sm flex-1">
                              <span className="font-medium capitalize">
                                {perm.resource}
                              </span>{" "}
                              <span className="text-muted-foreground">→</span>{" "}
                              <span className="text-primary capitalize">
                                {perm.action}
                              </span>
                            </span>
                            {perm.description && (
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                {perm.description}
                              </span>
                            )}
                          </label>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setAssignDialogOpen(false);
                    setSelectedPermissions([]);
                    setSelectedRole("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleAssignPermissions}
                  disabled={
                    !selectedRole || selectedPermissions.length === 0 || loading
                  }
                >
                  {loading
                    ? "Assigning..."
                    : `Assign ${selectedPermissions.length} Permission(s)`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Permission</DialogTitle>
              <DialogDescription>
                Update the permission description (resource and action cannot be
                changed)
              </DialogDescription>
            </DialogHeader>
            {editingPermission && (
              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <Label className="text-sm sm:text-base">Resource</Label>
                  <Input
                    value={editingPermission.resource}
                    disabled
                    className="capitalize bg-muted"
                  />
                </div>
                <div>
                  <Label className="text-sm sm:text-base">Action</Label>
                  <Input
                    value={editingPermission.action}
                    disabled
                    className="capitalize bg-muted"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-description"
                    className="text-sm sm:text-base"
                  >
                    Description
                  </Label>
                  <Input
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter description"
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
                  setEditingPermission(null);
                  setEditDescription("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleEditPermission}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Permission"}
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
                This will permanently delete the permission{" "}
                <strong className="capitalize text-foreground">
                  {deletingPermission?.resource}.{deletingPermission?.action}
                </strong>{" "}
                and remove it from all roles that have it assigned.
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
                onClick={handleDeletePermission}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Permission"}
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
                    Resource
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Action
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Key
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Description
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Assigned Roles
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {permissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-2">
                        No permissions found
                      </p>
                      <p className="text-sm">
                        Create your first permission to get started
                      </p>
                    </td>
                  </tr>
                ) : (
                  permissions
                    .filter((perm) => perm && perm._id)
                    .map((perm) => {
                      const assignedRoles = getAssignedRoles(perm._id);
                      return (
                        <tr
                          key={perm._id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="border-b px-4 py-3 capitalize font-medium">
                            {perm.resource}
                          </td>
                          <td className="border-b px-4 py-3 capitalize">
                            {perm.action}
                          </td>
                          <td className="border-b px-4 py-3">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {perm.key}
                            </code>
                          </td>
                          <td className="border-b px-4 py-3 text-sm text-muted-foreground">
                            {perm.description || "—"}
                          </td>
                          <td className="border-b px-4 py-3">
                            {assignedRoles.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {assignedRoles.map((role, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                                  >
                                    {role}
                                  </span>
                                ))}
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
                                onClick={() => openEditDialog(perm)}
                                title="Edit permission"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(perm)}
                                title="Delete permission"
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
          {permissions.length === 0 ? (
            <div className="rounded-md border">
              <div className="px-4 py-12 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">No permissions found</p>
                <p className="text-sm">
                  Create your first permission to get started
                </p>
              </div>
            </div>
          ) : (
            permissions
              .filter((perm) => perm && perm._id)
              .map((perm) => {
                const assignedRoles = getAssignedRoles(perm._id);
                return (
                  <div
                    key={perm._id}
                    className="rounded-md border p-4 space-y-3 bg-card hover:bg-muted/30 transition-colors"
                  >
                    {/* Resource & Action */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base capitalize">
                          {perm.resource}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium text-primary capitalize">
                          {perm.action}
                        </span>
                      </div>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                        {perm.key}
                      </code>
                    </div>

                    {/* Description */}
                    {perm.description && (
                      <p className="text-sm text-muted-foreground">
                        {perm.description}
                      </p>
                    )}

                    {/* Assigned Roles */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Assigned Roles
                      </p>
                      {assignedRoles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignedRoles.map((role, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No roles assigned
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(perm)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openDeleteDialog(perm)}
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
        {permissions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-md border bg-muted/30">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Permissions
              </p>
              <p className="text-lg sm:text-xl font-bold">
                {permissions.length}
              </p>
            </div>
            <div className="text-center sm:border-x">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Total Roles
              </p>
              <p className="text-lg sm:text-xl font-bold">{roles.length}</p>
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
