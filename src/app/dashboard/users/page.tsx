"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
import {
  Loader2,
  Users,
  UserPlus,
  Pencil,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermission";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

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

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

function errorMessage(err: unknown, fallback = "Unexpected error"): string {
  return err instanceof Error ? err.message : fallback;
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    const ct = res.headers.get("content-type");
    if (!ct || !ct.includes("application/json")) return null;
    const parsed = (await res.json()) as T;
    return parsed;
  } catch {
    return null;
  }
}

function extractMessage(
  res: Response,
  fallback: string,
  payload: ApiResponse<unknown> | null
): string {
  if (payload?.message) return payload.message;
  switch (res.status) {
    case 401:
      return "Unauthorized. Please log in.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "Not found.";
    default:
      return fallback;
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roleKeyManual, setRoleKeyManual] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [assigning, setAssigning] = useState<boolean>(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { toast } = useToast();

  const { permissions, loading: permsLoading } = usePermissions();
  const permsSet = useMemo(() => new Set(permissions), [permissions]);

  const hasKey = (resource: string, action: string): boolean =>
    permsSet.has(`${resource}.${action}`) ||
    permsSet.has(`${resource}:${action}`);

  const canCreateUsers = hasKey("users", "create");
  const canUpdateUsers = hasKey("users", "update");
  const canDeleteUsers = hasKey("users", "delete");

  const canReadRoles = hasKey("roles", "read");
  const canUpdateRoles = hasKey("roles", "update");

  const canReadPermissions = hasKey("permissions", "read");

  const canAssignRoles = canUpdateRoles || canUpdateUsers;

  const showRolesColumn = canReadRoles;
  const showPermissionsColumn = canReadPermissions;

  const fetchData = useCallback(
    async (opts: { fetchRoles: boolean }) => {
      setLoading(true);
      setFetchError(null);

      try {
        const resUsers = await fetch("/api/users");
        const dataUsers = await safeJson<ApiResponse<User[]>>(resUsers);

        if (
          resUsers.ok &&
          dataUsers?.success &&
          Array.isArray(dataUsers.data)
        ) {
          setUsers(dataUsers.data);
        } else {
          const msg = extractMessage(
            resUsers,
            "Failed to load users.",
            dataUsers
          );
          setFetchError((prev) => prev ?? msg);
          toast({ title: "Error", description: msg, variant: "destructive" });
        }

        if (opts.fetchRoles) {
          const resRoles = await fetch("/api/roles");
          const dataRoles = await safeJson<ApiResponse<Role[]>>(resRoles);

          if (
            resRoles.ok &&
            dataRoles?.success &&
            Array.isArray(dataRoles.data)
          ) {
            setRoles(dataRoles.data);
          } else {
            if (resRoles.status !== 403) {
              const msg = extractMessage(
                resRoles,
                "Failed to load roles.",
                dataRoles
              );
              setFetchError((prev) => prev ?? msg);
              toast({
                title: "Error",
                description: msg,
                variant: "destructive",
              });
            }
            setRoles([]);
          }
        } else {
          setRoles([]);
        }
      } catch (err: unknown) {
        const msg = errorMessage(err, "Network error loading users and roles.");
        setFetchError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!permsLoading) {
      void fetchData({ fetchRoles: canReadRoles });
    }
  }, [permsLoading, canReadRoles, fetchData]);

  const handleAssignRole = async () => {
    setAssignError(null);

    if (!canAssignRoles) {
      const msg = "You don't have permission to assign roles.";
      setAssignError(msg);
      toast({ title: "Forbidden", description: msg, variant: "destructive" });
      return;
    }

    if (!selectedUser) {
      setAssignError("Please select a user.");
      return;
    }

    let roleKeyToAssign = "";
    if (canReadRoles) {
      const roleObj = roles.find((r) => r._id === selectedRole);
      if (!selectedRole || !roleObj?.key) {
        setAssignError("Please select a role.");
        return;
      }
      roleKeyToAssign = roleObj.key;
    } else {
      const trimmed = roleKeyManual.trim();
      if (!trimmed) {
        setAssignError("Enter a role key.");
        return;
      }
      roleKeyToAssign = trimmed;
    }

    setAssigning(true);
    try {
      const res = await fetch("/api/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser,
          role_keys: [roleKeyToAssign],
        }),
      });

      const data = await safeJson<ApiResponse<unknown>>(res);

      if (res.ok && data?.success) {
        toast({ title: "Success", description: "Role assigned successfully." });
        await fetchData({ fetchRoles: canReadRoles });
        setSelectedUser("");
        setSelectedRole("");
        setRoleKeyManual("");
        setDialogOpen(false);
      } else {
        const msg = extractMessage(res, "Failed to assign role.", data);
        setAssignError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (err: unknown) {
      const msg = errorMessage(err, "Network error while assigning role.");
      setAssignError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteError(null);
    setDeleteUserId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;

    if (!canDeleteUsers) {
      const msg = "You don't have permission to delete users.";
      setDeleteError(msg);
      toast({ title: "Forbidden", description: msg, variant: "destructive" });
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/users?id=${deleteUserId}`, {
        method: "DELETE",
      });
      const data = await safeJson<ApiResponse<unknown>>(res);

      if (res.ok && data?.success) {
        setUsers((prev) => prev.filter((u) => u._id !== deleteUserId));
        toast({ title: "Success", description: "User deleted successfully." });
        setDeleteUserId(null);
      } else {
        const msg = extractMessage(res, "Failed to delete user.", data);
        setDeleteError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (err: unknown) {
      const msg = errorMessage(err, "Network error deleting user.");
      setDeleteError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const targetUser = deleteUserId
    ? users.find((u) => u._id === deleteUserId)
    : undefined;

  const uiLoading = loading || permsLoading;

  const totalRoleAssignments = users.reduce(
    (sum, user) => sum + (user.roles?.length || 0),
    0
  );

  if (uiLoading) {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Users Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage users, assign roles and control access
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {fetchError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {fetchError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href="/dashboard/users/newUser">
            <Button
              disabled={!canCreateUsers || permsLoading}
              title={!canCreateUsers ? "You need users.create permission" : ""}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </Link>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setAssignError(null);
                setSelectedUser("");
                setSelectedRole("");
                setRoleKeyManual("");
              }
              setDialogOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={permsLoading || !canAssignRoles}
                title={
                  !canAssignRoles
                    ? "You need roles.update or users.update to assign"
                    : ""
                }
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Assign Role to User
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Assign Role to User</DialogTitle>
                <DialogDescription>
                  Select a user and role to create a new assignment
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-4">
                <div>
                  <Label htmlFor="select-user">Select User *</Label>
                  <Select
                    onValueChange={setSelectedUser}
                    value={selectedUser}
                    disabled={assigning || uiLoading}
                  >
                    <SelectTrigger id="select-user">
                      <SelectValue placeholder="Choose a user" />
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

                {canReadRoles ? (
                  <div>
                    <Label htmlFor="select-role">Select Role *</Label>
                    <Select
                      onValueChange={setSelectedRole}
                      value={selectedRole}
                      disabled={assigning || uiLoading}
                    >
                      <SelectTrigger id="select-role">
                        <SelectValue placeholder="Choose a role" />
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
                ) : (
                  <div>
                    <Label htmlFor="role-key-manual">Role Key *</Label>
                    <Input
                      id="role-key-manual"
                      value={roleKeyManual}
                      onChange={(e) => setRoleKeyManual(e.target.value)}
                      placeholder="e.g. admin, editor, moderator"
                      disabled={assigning || uiLoading || !canAssignRoles}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      You don&apos;t have roles.read; enter a known role key.
                    </p>
                  </div>
                )}

                {assignError && (
                  <div className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                    {assignError}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={assigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignRole}
                  disabled={
                    assigning ||
                    !canAssignRoles ||
                    !selectedUser ||
                    (canReadRoles ? !selectedRole : !roleKeyManual.trim())
                  }
                >
                  {assigning ? "Assigning..." : "Assign Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteUserId}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteUserId(null);
              setDeleteError(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user{" "}
                <strong className="text-foreground">{targetUser?.name}</strong>{" "}
                ({targetUser?.email}) and remove all their role assignments.
                <br />
                <br />
                <span className="text-destructive font-medium">
                  This action cannot be undone.
                </span>
                {deleteError && (
                  <div className="mt-3 text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                    {deleteError}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting || !canDeleteUsers}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Users Table */}
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Name
                  </th>
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Email
                  </th>
                  {showRolesColumn && (
                    <th className="border-b px-4 py-3 text-left font-medium">
                      Roles
                    </th>
                  )}
                  {showPermissionsColumn && (
                    <th className="border-b px-4 py-3 text-left font-medium">
                      Permissions
                    </th>
                  )}
                  <th className="border-b px-4 py-3 text-left font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        2 +
                        (showRolesColumn ? 1 : 0) +
                        (showPermissionsColumn ? 1 : 0) +
                        1
                      }
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-2">No users found</p>
                      <p className="text-sm">
                        Create your first user to get started
                      </p>
                    </td>
                  </tr>
                ) : (
                  users
                    .filter((user) => user && user._id)
                    .map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="border-b px-4 py-3 font-medium">
                          {user.name}
                        </td>
                        <td className="border-b px-4 py-3 text-sm text-muted-foreground">
                          {user.email}
                        </td>

                        {showRolesColumn && (
                          <td className="border-b px-4 py-3">
                            {(() => {
                              if (
                                !user.roles ||
                                !Array.isArray(user.roles) ||
                                user.roles.length === 0
                              ) {
                                return (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                );
                              }

                              const validRoles = user.roles
                                .filter((role) => role && role.title)
                                .filter(
                                  (role, index, self) =>
                                    index ===
                                    self.findIndex(
                                      (r) => r.title === role.title
                                    )
                                );

                              return (
                                <div className="flex flex-wrap gap-1">
                                  {validRoles.slice(0, 3).map((role, index) => (
                                    <span
                                      key={`user-${user._id}-role-idx-${index}`}
                                      className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                                    >
                                      {role.title}
                                    </span>
                                  ))}
                                  {validRoles.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                                      +{validRoles.length - 3} more
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                        )}

                        {showPermissionsColumn && (
                          <td className="border-b px-4 py-3">
                            {user.permissions && user.permissions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {(() => {
                                  const validPermissions =
                                    user.permissions.filter(
                                      (p) =>
                                        p && p._id && p.resource && p.action
                                    );

                                  const uniquePermissions =
                                    validPermissions.filter(
                                      (permission, index, self) =>
                                        index ===
                                        self.findIndex(
                                          (p) =>
                                            p.resource ===
                                              permission.resource &&
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

                                  const entries = Object.entries(resourceMap);
                                  return (
                                    <>
                                      {entries
                                        .slice(0, 2)
                                        .map(([resource, actionsSet]) => (
                                          <span
                                            key={`${user._id}-perm-${resource}`}
                                            className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium"
                                          >
                                            {resource} ({actionsSet.size})
                                          </span>
                                        ))}
                                      {entries.length > 2 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                                          +{entries.length - 2} more
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </td>
                        )}

                        <td className="border-b px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/users/edit/${user._id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canUpdateUsers || permsLoading}
                                title={
                                  !canUpdateUsers
                                    ? "You need users.update"
                                    : "Edit user"
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canDeleteUsers || permsLoading}
                              title={
                                !canDeleteUsers
                                  ? "You need users.delete"
                                  : "Delete user"
                              }
                              onClick={() => openDeleteDialog(user._id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Statistics */}
        {users.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Total Users: <span className="font-medium">{users.length}</span>
            </p>
            {showRolesColumn && (
              <p>
                Total Role Assignments:{" "}
                <span className="font-medium">{totalRoleAssignments}</span>
              </p>
            )}
            {showRolesColumn && (
              <p>
                Available Roles:{" "}
                <span className="font-medium">{roles.length}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
