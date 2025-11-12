"use client";

import { useState, useCallback, useMemo, memo } from "react";
import useSWR, { mutate } from "swr";
import { User } from "@/types/user";
import { Role } from "@/types/role";
import { Permission } from "@/types/permission";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Pencil,
  Trash2,
  Plus,
  Users as UsersIcon,
  ShieldCheck,
  Lock,
  Mail,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role_ids: string[];
}

const SystemBadge = memo(() => (
  <Badge variant="secondary" className="text-xs">
    <Lock className="h-3 w-3 mr-1" />
    System
  </Badge>
));
SystemBadge.displayName = "SystemBadge";

const RoleBadge = memo(({ role }: { role: Role }) => (
  <Badge variant="default" className="text-xs flex items-center gap-1">
    {role.title}
    {role.is_system && <Lock className="h-2.5 w-2.5" />}
  </Badge>
));
RoleBadge.displayName = "RoleBadge";

const RolesBadgeList = memo(({ roles }: { roles: Role[] }) => {
  if (roles.length === 0) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {roles.slice(0, 3).map((role, idx) => (
        <RoleBadge key={idx} role={role} />
      ))}
      {roles.length > 3 && (
        <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
          +{roles.length - 3} more
        </span>
      )}
    </div>
  );
});
RolesBadgeList.displayName = "RolesBadgeList";

const PermissionsBadgeList = memo(
  ({ permissions }: { permissions: Permission[] }) => {
    const permissionsByResource = useMemo(() => {
      return permissions.reduce((acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = new Set<string>();
        }
        acc[perm.resource].add(perm.action);
        return acc;
      }, {} as Record<string, Set<string>>);
    }, [permissions]);

    if (Object.keys(permissionsByResource).length === 0) {
      return <span className="text-muted-foreground text-sm">—</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(permissionsByResource)
          .slice(0, 2)
          .map(([resource, actionsSet]) => (
            <span
              key={resource}
              className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium"
            >
              {resource} ({actionsSet.size})
            </span>
          ))}
        {Object.keys(permissionsByResource).length > 2 && (
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
            +{Object.keys(permissionsByResource).length - 2} more
          </span>
        )}
      </div>
    );
  }
);
PermissionsBadgeList.displayName = "PermissionsBadgeList";

const UserTableRow = memo(
  ({
    user,
    roles,
    permissions,
    onEdit,
    onDelete,
  }: {
    user: User;
    roles: Role[];
    permissions: Permission[];
    onEdit: (userId: string) => void;
    onDelete: (user: User) => void;
  }) => {
    return (
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            {user.is_system && <SystemBadge />}
          </div>
        </td>
        <td className="border-b px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </div>
        </td>
        <td className="border-b px-4 py-3">
          <RolesBadgeList roles={roles} />
        </td>
        <td className="border-b px-4 py-3">
          <PermissionsBadgeList permissions={permissions} />
        </td>
        <td className="border-b px-4 py-3">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(user._id)}
              title="Edit user"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(user)}
              disabled={user.is_system}
              title={
                user.is_system
                  ? "System users cannot be deleted"
                  : "Delete user"
              }
            >
              <Trash2
                className={`h-4 w-4 ${
                  user.is_system ? "text-muted-foreground" : "text-destructive"
                }`}
              />
            </Button>
          </div>
        </td>
      </tr>
    );
  }
);
UserTableRow.displayName = "UserTableRow";

const UserMobileCard = memo(
  ({
    user,
    roles,
    permissions,
    onEdit,
    onDelete,
  }: {
    user: User;
    roles: Role[];
    permissions: Permission[];
    onEdit: (userId: string) => void;
    onDelete: (user: User) => void;
  }) => {
    const permissionsByResource = useMemo(() => {
      return permissions.reduce((acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = new Set<string>();
        }
        acc[perm.resource].add(perm.action);
        return acc;
      }, {} as Record<string, Set<string>>);
    }, [permissions]);

    return (
      <div className="rounded-md border p-4 space-y-3 bg-card hover:bg-muted/30 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-base">{user.name}</h3>
            {user.is_system && <SystemBadge />}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span>{user.email}</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Roles
          </p>
          {roles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {roles.map((role, idx) => (
                <RoleBadge key={idx} role={role} />
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              No roles assigned
            </span>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" />
            Permissions
          </p>
          {Object.keys(permissionsByResource).length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {Object.entries(permissionsByResource).map(
                ([resource, actionsSet]) => (
                  <span
                    key={resource}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium"
                  >
                    {resource} ({actionsSet.size})
                  </span>
                )
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              No permissions
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(user._id)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(user)}
            disabled={user.is_system}
          >
            <Trash2
              className={`h-4 w-4 mr-2 ${
                user.is_system ? "text-muted-foreground" : "text-destructive"
              }`}
            />
            {user.is_system ? "Protected" : "Delete"}
          </Button>
        </div>
      </div>
    );
  }
);
UserMobileCard.displayName = "UserMobileCard";

const RoleCheckboxItem = memo(
  ({
    role,
    isSelected,
    onToggle,
  }: {
    role: Role;
    isSelected: boolean;
    onToggle: () => void;
  }) => (
    <div
      className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 px-2 rounded"
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="rounded pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      />
      <span className="text-xs sm:text-sm flex-1 flex items-center gap-2">
        <span className="font-medium">{role.title}</span>
        {role.is_system && <SystemBadge />}
      </span>
      {role.description && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {role.description}
        </span>
      )}
    </div>
  )
);
RoleCheckboxItem.displayName = "RoleCheckboxItem";

const EmptyState = memo(() => (
  <div className="px-4 py-12 text-center text-muted-foreground">
    <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
    <p className="text-lg font-medium mb-2">No users found</p>
    <p className="text-sm">Create your first user to get started</p>
  </div>
));
EmptyState.displayName = "EmptyState";

const StatsCard = memo(
  ({
    totalUsers,
    systemUsers,
    totalRoles,
  }: {
    totalUsers: number;
    systemUsers: number;
    totalRoles: number;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-md border bg-muted/30">
      <div className="text-center">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
          Total Users
        </p>
        <p className="text-lg sm:text-xl font-bold">{totalUsers}</p>
      </div>
      <div className="text-center sm:border-x">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
          System Users
        </p>
        <p className="text-lg sm:text-xl font-bold">{systemUsers}</p>
      </div>
      <div className="text-center">
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
          Total Roles
        </p>
        <p className="text-lg sm:text-xl font-bold">{totalRoles}</p>
      </div>
    </div>
  )
);
StatsCard.displayName = "StatsCard";

export default function UsersPage() {
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role_ids: [],
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const { data: usersData, isLoading: usersLoading } =
    useSWR<ApiResponse<User[]>>("/api/users");

  const { data: rolesData } = useSWR<ApiResponse<Role[]>>("/api/roles");

  const users = useMemo(() => usersData?.data || [], [usersData?.data]);

  const roles = useMemo(() => rolesData?.data || [], [rolesData?.data]);

  const validUsers = useMemo(
    () => users.filter((user) => user && user._id),
    [users]
  );

  const usersWithData = useMemo(() => {
    return validUsers.map((user) => ({
      user,
      roles: user.roles || [],
      permissions: user.permissions || [],
    }));
  }, [validUsers]);

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      systemUsers: users.filter((u) => u.is_system).length,
      totalRoles: roles.length,
    }),
    [users, roles.length]
  );

  const toggleRole = useCallback((roleId: string) => {
    setNewUser((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId],
    }));
  }, []);

  const resetCreateForm = useCallback(() => {
    setNewUser({
      name: "",
      email: "",
      password: "",
      role_ids: [],
    });
  }, []);

  const handleCreateUser = useCallback(async () => {
    if (
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.password.trim()
    ) {
      toast({
        title: "Validation Error",
        description: "Name, email, and password are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          password: newUser.password.trim(),
          role_ids: newUser.role_ids.length > 0 ? newUser.role_ids : undefined,
        }),
      });
      const data: ApiResponse<User> = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `User created successfully${
            newUser.role_ids.length > 0
              ? ` with ${newUser.role_ids.length} role(s)`
              : ""
          }!`,
        });

        await mutate("/api/users");

        setCreateDialogOpen(false);
        resetCreateForm();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create user",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error creating user:", err);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [newUser, toast, resetCreateForm]);

  const handleEdit = useCallback(
    (userId: string) => {
      router.push(`/dashboard/users/edit/${userId}`);
    },
    [router]
  );

  const openDeleteDialog = useCallback(
    (user: User) => {
      if (!user?._id) {
        toast({
          title: "Error",
          description: "Invalid user selected",
          variant: "destructive",
        });
        return;
      }

      if (user.is_system) {
        toast({
          title: "Cannot Delete",
          description:
            "System users cannot be deleted as they are required for core functionality.",
          variant: "destructive",
        });
        return;
      }

      setDeletingUser(user);
      setDeleteDialogOpen(true);
    },
    [toast]
  );

  const handleDeleteUser = useCallback(async () => {
    if (!deletingUser?._id) {
      toast({
        title: "Error",
        description: "Invalid user selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users?id=${deletingUser._id}`, {
        method: "DELETE",
      });
      const data: ApiResponse<null> = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "User deleted successfully",
        });

        await mutate("/api/users");

        setDeleteDialogOpen(false);
        setDeletingUser(null);
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [deletingUser, toast]);

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
    resetCreateForm();
  }, [resetCreateForm]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewUser((prev) => ({ ...prev, name: e.target.value }));
    },
    []
  );

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewUser((prev) => ({ ...prev, email: e.target.value }));
    },
    []
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewUser((prev) => ({ ...prev, password: e.target.value }));
    },
    []
  );

  const isCreateDisabled = useMemo(() => {
    return (
      loading ||
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.password.trim()
    );
  }, [loading, newUser.name, newUser.email, newUser.password]);

  if (usersLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading users...</p>
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
              <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              Users Management
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage users, assign roles and control access
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Create a new user and optionally assign roles
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <Label htmlFor="user-name" className="text-sm sm:text-base">
                    Name *
                  </Label>
                  <Input
                    id="user-name"
                    placeholder="Enter user's full name"
                    value={newUser.name}
                    onChange={handleNameChange}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="user-email" className="text-sm sm:text-base">
                    Email *
                  </Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={handleEmailChange}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="user-password"
                    className="text-sm sm:text-base"
                  >
                    Password *
                  </Label>
                  <Input
                    id="user-password"
                    type="password"
                    placeholder="Enter password (min 6 characters)"
                    value={newUser.password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                  />
                </div>

                <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                  <p className="text-xs sm:text-sm font-medium mb-3">
                    Assign Roles ({newUser.role_ids.length} selected):
                  </p>
                  {roles.length === 0 ? (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                      No roles available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {roles
                        .filter((role) => role && role._id)
                        .map((role) => (
                          <RoleCheckboxItem
                            key={role._id}
                            role={role}
                            isSelected={newUser.role_ids.includes(role._id)}
                            onToggle={() => toggleRole(role._id)}
                          />
                        ))}
                    </div>
                  )}
                  {newUser.role_ids.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md mt-2">
                      ⚠️ No roles selected. Default &quot;Author&quot; role will
                      be assigned if available.
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleCloseCreateDialog}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleCreateUser}
                  disabled={isCreateDisabled}
                >
                  {loading ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user{" "}
                <strong className="text-foreground">
                  {deletingUser?.name}
                </strong>{" "}
                ({deletingUser?.email}) and remove all their role assignments.
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
                onClick={handleDeleteUser}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete User"}
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
                    User
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Email
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Roles
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
                {usersWithData.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  usersWithData.map(({ user, roles, permissions }) => (
                    <UserTableRow
                      key={user._id}
                      user={user}
                      roles={roles}
                      permissions={permissions}
                      onEdit={handleEdit}
                      onDelete={openDeleteDialog}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden space-y-4">
          {usersWithData.length === 0 ? (
            <div className="rounded-md border">
              <EmptyState />
            </div>
          ) : (
            usersWithData.map(({ user, roles, permissions }) => (
              <UserMobileCard
                key={user._id}
                user={user}
                roles={roles}
                permissions={permissions}
                onEdit={handleEdit}
                onDelete={openDeleteDialog}
              />
            ))
          )}
        </div>

        {users.length > 0 && (
          <StatsCard
            totalUsers={stats.totalUsers}
            systemUsers={stats.systemUsers}
            totalRoles={stats.totalRoles}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
