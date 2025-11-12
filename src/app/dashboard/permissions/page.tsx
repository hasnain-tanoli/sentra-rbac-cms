"use client";

import { useState, useCallback, useMemo, memo } from "react";
import useSWR, { mutate } from "swr";
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
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Pencil,
  Trash2,
  Plus,
  Shield,
  ShieldCheck,
  Lock,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PermissionSchema {
  actions: string[];
  resources: string[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface PermissionFormData {
  resource: string;
  action: string;
  description: string;
}

const ResourceBadge = memo(({ isSystem }: { isSystem?: boolean }) => {
  if (!isSystem) return null;
  return (
    <Badge variant="secondary" className="text-xs whitespace-nowrap">
      <Lock className="h-3 w-3 mr-1" />
      System
    </Badge>
  );
});
ResourceBadge.displayName = "ResourceBadge";

const RolesBadgeList = memo(({ roles }: { roles: string[] }) => {
  if (roles.length === 0) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role, idx) => (
        <span
          key={`${role}-${idx}`}
          className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
        >
          {role}
        </span>
      ))}
    </div>
  );
});
RolesBadgeList.displayName = "RolesBadgeList";

const PermissionTableRow = memo(
  ({
    permission,
    assignedRoles,
    onEdit,
    onDelete,
  }: {
    permission: Permission;
    assignedRoles: string[];
    onEdit: (perm: Permission) => void;
    onDelete: (perm: Permission) => void;
  }) => {
    return (
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="capitalize font-medium">
              {permission.resource}
            </span>
            <ResourceBadge isSystem={permission.is_system} />
          </div>
        </td>
        <td className="border-b px-4 py-3 capitalize">{permission.action}</td>
        <td className="border-b px-4 py-3">
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {permission.key}
          </code>
        </td>
        <td className="border-b px-4 py-3 text-sm text-muted-foreground">
          {permission.description || "—"}
        </td>
        <td className="border-b px-4 py-3">
          <RolesBadgeList roles={assignedRoles} />
        </td>
        <td className="border-b px-4 py-3">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(permission)}
              title="Edit permission"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(permission)}
              disabled={permission.is_system}
              title={
                permission.is_system
                  ? "System permissions cannot be deleted"
                  : "Delete permission"
              }
            >
              <Trash2
                className={`h-4 w-4 ${
                  permission.is_system
                    ? "text-muted-foreground"
                    : "text-destructive"
                }`}
              />
            </Button>
          </div>
        </td>
      </tr>
    );
  }
);
PermissionTableRow.displayName = "PermissionTableRow";

const PermissionMobileCard = memo(
  ({
    permission,
    assignedRoles,
    onEdit,
    onDelete,
  }: {
    permission: Permission;
    assignedRoles: string[];
    onEdit: (perm: Permission) => void;
    onDelete: (perm: Permission) => void;
  }) => {
    return (
      <div className="rounded-md border p-4 space-y-3 bg-card hover:bg-muted/30 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-base capitalize">
              {permission.resource}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-primary capitalize">
              {permission.action}
            </span>
            <ResourceBadge isSystem={permission.is_system} />
          </div>
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
            {permission.key}
          </code>
        </div>

        {permission.description && (
          <p className="text-sm text-muted-foreground">
            {permission.description}
          </p>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Assigned Roles
          </p>
          {assignedRoles.length > 0 ? (
            <RolesBadgeList roles={assignedRoles} />
          ) : (
            <span className="text-sm text-muted-foreground">
              No roles assigned
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(permission)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(permission)}
            disabled={permission.is_system}
          >
            <Trash2
              className={`h-4 w-4 mr-2 ${
                permission.is_system
                  ? "text-muted-foreground"
                  : "text-destructive"
              }`}
            />
            {permission.is_system ? "Protected" : "Delete"}
          </Button>
        </div>
      </div>
    );
  }
);
PermissionMobileCard.displayName = "PermissionMobileCard";

const EmptyState = memo(() => (
  <div className="px-4 py-12 text-center text-muted-foreground">
    <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
    <p className="text-lg font-medium mb-2">No permissions found</p>
    <p className="text-sm">Create your first permission to get started</p>
  </div>
));
EmptyState.displayName = "EmptyState";

const StatsCard = memo(
  ({
    permissionsCount,
    rolesCount,
    assignmentsCount,
  }: {
    permissionsCount: number;
    rolesCount: number;
    assignmentsCount: number;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-md border bg-muted/30">
      <div className="text-center">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
          Total Permissions
        </p>
        <p className="text-lg sm:text-xl font-bold">{permissionsCount}</p>
      </div>
      <div className="text-center sm:border-x">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
          Total Roles
        </p>
        <p className="text-lg sm:text-xl font-bold">{rolesCount}</p>
      </div>
      <div className="text-center">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
          Total Assignments
        </p>
        <p className="text-lg sm:text-xl font-bold">{assignmentsCount}</p>
      </div>
    </div>
  )
);
StatsCard.displayName = "StatsCard";

export default function PermissionsPage() {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState<PermissionFormData>({
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

  const { data: schemaData } = useSWR<ApiResponse<PermissionSchema>>(
    "/api/permissions?schema=true"
  );

  const { data: permissionsData, isLoading: permissionsLoading } =
    useSWR<ApiResponse<Permission[]>>("/api/permissions");

  const { data: rolesData } = useSWR<ApiResponse<Role[]>>("/api/roles");

  const { data: assignmentsData } = useSWR<ApiResponse<RolePermission[]>>(
    "/api/role-permissions"
  );

  const permissions = useMemo(
    () => permissionsData?.data || [],
    [permissionsData?.data]
  );

  const roles = useMemo(() => rolesData?.data || [], [rolesData?.data]);

  const assignments = useMemo(
    () => assignmentsData?.data || [],
    [assignmentsData?.data]
  );

  const availableResources = useMemo(
    () => schemaData?.data?.resources || [],
    [schemaData?.data?.resources]
  );

  const availableActions = useMemo(
    () => schemaData?.data?.actions || [],
    [schemaData?.data?.actions]
  );

  const getAssignedRoles = useCallback(
    (permissionId: string): string[] => {
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
    },
    [assignments]
  );

  const permissionsWithRoles = useMemo(() => {
    return permissions
      .filter((perm) => perm && perm._id)
      .map((perm) => ({
        permission: perm,
        assignedRoles: getAssignedRoles(perm._id),
      }));
  }, [permissions, getAssignedRoles]);

  const validPermissions = useMemo(() => {
    return permissions.filter((perm) => perm && perm._id);
  }, [permissions]);

  const stats = useMemo(
    () => ({
      permissionsCount: validPermissions.length,
      rolesCount: roles.length,
      assignmentsCount: assignments.length,
    }),
    [validPermissions.length, roles.length, assignments.length]
  );

  const resetNewPermissionForm = useCallback(() => {
    setNewPermission({ resource: "", action: "", description: "" });
  }, []);

  const handleCreatePermission = useCallback(async () => {
    if (!newPermission.resource || !newPermission.action) {
      toast({
        title: "Validation Error",
        description: "Resource and action are required",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPermission),
      });
      const data: ApiResponse<Permission> = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Permission created successfully",
        });

        await Promise.all([
          mutate("/api/permissions"),
          mutate("/api/role-permissions"),
        ]);

        setCreateDialogOpen(false);
        resetNewPermissionForm();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create permission",
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
      setActionLoading(false);
    }
  }, [newPermission, toast, resetNewPermissionForm]);

  const openEditDialog = useCallback(
    (permission: Permission) => {
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
    },
    [toast]
  );

  const handleEditPermission = useCallback(async () => {
    if (!editingPermission?._id) {
      toast({
        title: "Error",
        description: "Invalid permission selected",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/permissions/${editingPermission._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription }),
      });
      const data: ApiResponse<Permission> = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Permission updated successfully",
        });

        await mutate("/api/permissions");

        setEditDialogOpen(false);
        setEditingPermission(null);
        setEditDescription("");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update permission",
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
      setActionLoading(false);
    }
  }, [editingPermission, editDescription, toast]);

  const openDeleteDialog = useCallback(
    (permission: Permission) => {
      if (!permission?._id) {
        toast({
          title: "Error",
          description: "Invalid permission selected",
          variant: "destructive",
        });
        return;
      }

      if (permission.is_system) {
        toast({
          title: "Cannot Delete",
          description:
            "System permissions cannot be deleted as they are required for core functionality.",
          variant: "destructive",
        });
        return;
      }

      setDeletingPermission(permission);
      setDeleteDialogOpen(true);
    },
    [toast]
  );

  const handleDeletePermission = useCallback(async () => {
    if (!deletingPermission?._id) {
      toast({
        title: "Error",
        description: "Invalid permission selected",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/permissions/${deletingPermission._id}`, {
        method: "DELETE",
      });
      const data: ApiResponse<null> = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Permission deleted successfully",
        });

        await Promise.all([
          mutate("/api/permissions"),
          mutate("/api/role-permissions"),
        ]);

        setDeleteDialogOpen(false);
        setDeletingPermission(null);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete permission",
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
      setActionLoading(false);
    }
  }, [deletingPermission, toast]);

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
    resetNewPermissionForm();
  }, [resetNewPermissionForm]);

  const handleCloseEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setEditingPermission(null);
    setEditDescription("");
  }, []);

  const handleResourceChange = useCallback((value: string) => {
    setNewPermission((prev) => ({ ...prev, resource: value }));
  }, []);

  const handleActionChange = useCallback((value: string) => {
    setNewPermission((prev) => ({ ...prev, action: value }));
  }, []);

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewPermission((prev) => ({ ...prev, description: e.target.value }));
    },
    []
  );

  const handleEditDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditDescription(e.target.value);
    },
    []
  );

  const isCreateButtonDisabled = useMemo(() => {
    return actionLoading || !newPermission.resource || !newPermission.action;
  }, [actionLoading, newPermission.resource, newPermission.action]);

  if (permissionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading permissions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
                    onValueChange={handleResourceChange}
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
                    onValueChange={handleActionChange}
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
                    onChange={handleDescriptionChange}
                    placeholder="Enter description (optional)"
                    disabled={actionLoading}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleCloseCreateDialog}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleCreatePermission}
                  disabled={isCreateButtonDisabled}
                >
                  {actionLoading ? "Creating..." : "Create Permission"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingPermission.resource}
                      disabled
                      className="capitalize bg-muted"
                    />
                    <ResourceBadge isSystem={editingPermission.is_system} />
                  </div>
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
                    onChange={handleEditDescriptionChange}
                    placeholder="Enter description"
                    disabled={actionLoading}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleCloseEditDialog}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleEditPermission}
                disabled={actionLoading}
              >
                {actionLoading ? "Updating..." : "Update Permission"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                disabled={actionLoading}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeletePermission}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete Permission"}
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
                {permissionsWithRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  permissionsWithRoles.map(({ permission, assignedRoles }) => (
                    <PermissionTableRow
                      key={permission._id}
                      permission={permission}
                      assignedRoles={assignedRoles}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden space-y-4">
          {permissionsWithRoles.length === 0 ? (
            <div className="rounded-md border">
              <EmptyState />
            </div>
          ) : (
            permissionsWithRoles.map(({ permission, assignedRoles }) => (
              <PermissionMobileCard
                key={permission._id}
                permission={permission}
                assignedRoles={assignedRoles}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
              />
            ))
          )}
        </div>

        {validPermissions.length > 0 && (
          <StatsCard
            permissionsCount={stats.permissionsCount}
            rolesCount={stats.rolesCount}
            assignmentsCount={stats.assignmentsCount}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
