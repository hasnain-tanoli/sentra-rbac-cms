"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermission";
import { Input } from "@/components/ui/input";

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
      return "You don’t have permission to perform this action.";
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

  // Permissions
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

  // Allow assignment if they can update roles OR users
  const canAssignRoles = canUpdateRoles || canUpdateUsers;

  // Column visibility
  const showRolesColumn = canReadRoles;
  const showPermissionsColumn = canReadPermissions;

  const fetchData = async (opts: { fetchRoles: boolean }) => {
    setLoading(true);
    setFetchError(null);

    try {
      // Users
      const resUsers = await fetch("/api/users");
      const dataUsers = await safeJson<ApiResponse<User[]>>(resUsers);

      if (resUsers.ok && dataUsers?.success && Array.isArray(dataUsers.data)) {
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

      // Roles: only fetch if we truly have roles.read (to avoid forbidden toasts)
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
          // Swallow 403 silently; other errors still toast
          if (resRoles.status !== 403) {
            const msg = extractMessage(
              resRoles,
              "Failed to load roles.",
              dataRoles
            );
            setFetchError((prev) => prev ?? msg);
            toast({ title: "Error", description: msg, variant: "destructive" });
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
  };

  // Load data once permissions are known; only fetch roles if roles.read is present
  useEffect(() => {
    if (!permsLoading) {
      void fetchData({ fetchRoles: canReadRoles });
    }
  }, [permsLoading, canReadRoles,]);

  const handleAssignRole = async () => {
    setAssignError(null);

    if (!canAssignRoles) {
      const msg = "You don’t have permission to assign roles.";
      setAssignError(msg);
      toast({ title: "Forbidden", description: msg, variant: "destructive" });
      return;
    }

    if (!selectedUser) {
      setAssignError("Please select a user.");
      return;
    }

    // Determine the role key based on permission to list roles
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
      const msg = "You don’t have permission to delete users.";
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
        toast({ title: "Deleted", description: "User deleted successfully." });
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

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <Link href="/dashboard/users/newUser">
          <Button
            disabled={!canCreateUsers || permsLoading}
            title={!canCreateUsers ? "You need users.create" : ""}
          >
            Create New User
          </Button>
        </Link>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {fetchError}
        </div>
      )}

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
            className="mb-6"
            disabled={permsLoading || !canAssignRoles}
            title={
              !canAssignRoles
                ? "You need roles.update or users.update to assign"
                : ""
            }
          >
            Assign Role to User
          </Button>
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
                disabled={assigning || uiLoading}
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

            {canReadRoles ? (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Role
                </label>
                <Select
                  onValueChange={setSelectedRole}
                  value={selectedRole}
                  disabled={assigning || uiLoading}
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
            ) : (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Role Key
                </label>
                <Input
                  value={roleKeyManual}
                  onChange={(e) => setRoleKeyManual(e.target.value)}
                  placeholder="e.g. admin, editor, moderator"
                  disabled={assigning || uiLoading || !canAssignRoles}
                />
                <div className="text-xs text-muted-foreground mt-2">
                  You don’t have roles.read; enter a known role key.
                </div>
              </div>
            )}

            {assignError && (
              <div className="text-red-600 text-sm -mt-1">{assignError}</div>
            )}

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
                disabled={
                  assigning ||
                  !canAssignRoles ||
                  !selectedUser ||
                  (canReadRoles ? !selectedRole : !roleKeyManual.trim())
                }
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

      {uiLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No users found.</p>
            <Link href="/dashboard/users/newUser">
              <Button
                disabled={!canCreateUsers}
                title={!canCreateUsers ? "You need users.create" : ""}
              >
                Create Your First User
              </Button>
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
                  {showRolesColumn && <TableHead>Roles</TableHead>}
                  {showPermissionsColumn && <TableHead>Permissions</TableHead>}
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

                      {showRolesColumn && (
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
                              .filter((role) => role && role.title)
                              .filter(
                                (role, index, self) =>
                                  index ===
                                  self.findIndex((r) => r.title === role.title)
                              );

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
                      )}

                      {showPermissionsColumn && (
                        <TableCell>
                          {user.permissions && user.permissions.length > 0 ? (
                            <div className="text-sm">
                              {(() => {
                                const validPermissions =
                                  user.permissions.filter(
                                    (p) => p && p._id && p.resource && p.action
                                  );

                                const uniquePermissions =
                                  validPermissions.filter(
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
                      )}

                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/dashboard/users/edit/${user._id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!canUpdateUsers || permsLoading}
                              title={
                                !canUpdateUsers ? "You need users.update" : ""
                              }
                            >
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={!canDeleteUsers || permsLoading}
                            title={
                              !canDeleteUsers ? "You need users.delete" : ""
                            }
                            onClick={() => openDeleteDialog(user._id)}
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

      <AlertDialog
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.{" "}
              {targetUser
                ? `This will permanently delete ${targetUser.name} (${targetUser.email}).`
                : ""}
              {deleteError && (
                <div className="mt-3 text-red-600 text-sm">{deleteError}</div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting || !canDeleteUsers}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
