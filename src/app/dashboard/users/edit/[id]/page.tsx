"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { use } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Role } from "@/types/role";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSystemUser, setIsSystemUser] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching user and role data for ID:", id);

        const userRes = await fetch(`/api/users?id=${id}`);
        const userData = await userRes.json();
        if (!userData.success || !userData.data) {
          toast({
            title: "Error",
            description: "Failed to fetch user details",
            variant: "destructive",
          });
          router.push("/dashboard/users");
          return;
        }

        const user = userData.data;
        setName(user.name || "");
        setEmail(user.email || "");
        setIsSystemUser(user.is_system || false);

        if (Array.isArray(user.roles)) {
          const roleIds = user.roles.map((r: Role) => String(r._id));
          setSelectedRoles(roleIds);
        }

        const rolesRes = await fetch("/api/roles");
        const rolesData = await rolesRes.json();

        if (rolesData.success && Array.isArray(rolesData.data)) {
          setRoles(
            rolesData.data.map((r: Role) => ({
              ...r,
              _id: String(r._id),
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast({
          title: "Error",
          description: "Failed to fetch required data",
          variant: "destructive",
        });
        router.push("/dashboard/users");
      } finally {
        setFetchLoading(false);
      }
    }

    fetchData();
  }, [id, router, toast]);

  const handleUpdateUser = async () => {
    if (!name || !email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    const roleKeys = selectedRoles
      .map((roleId) => {
        const role = roles.find((r) => r._id === roleId);
        return role ? role.key : "";
      })
      .filter((key) => key !== "");

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name,
          email,
          role_keys: roleKeys,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "User updated successfully!",
        });
        router.push("/dashboard/users");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to update user:", err);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (isSystemUser) {
      toast({
        title: "Cannot Delete",
        description: "System users cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "User deleted successfully!",
        });
        router.push("/dashboard/users");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast({
        title: "Error",
        description: "An error occurred while deleting the user.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  if (fetchLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading user details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedSet = new Set(selectedRoles.map(String));
  const assignedRoles = roles.filter((role) => selectedSet.has(role._id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              Edit User
              {isSystemUser && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  System User
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Update user information and manage role assignments
            </p>
          </div>
          <Link href="/dashboard/users" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">User Details</CardTitle>
              <CardDescription className="text-sm">
                Update the user&apos;s basic information and role assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Name"
                    value={name || ""}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading || deleting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">
                    Email
                  </Label>
                  <Input
                    id="email"
                    placeholder="Email"
                    type="email"
                    value={email || ""}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || deleting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">
                    Currently Assigned Roles
                  </Label>
                  <div className="p-3 border rounded-md bg-muted/30">
                    {assignedRoles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedRoles.map((role) => (
                          <Badge
                            key={`assigned-${role._id}`}
                            variant="default"
                            className="flex items-center gap-1"
                          >
                            {role.title}
                            {role.is_system && <Lock className="h-3 w-3" />}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No roles assigned
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm sm:text-base">
                    Manage User Roles
                  </Label>
                  <div className="space-y-2 border rounded-md p-4 max-h-64 overflow-y-auto">
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <div
                          key={role._id}
                          className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors"
                        >
                          <Checkbox
                            id={`role-${role._id}`}
                            checked={selectedRoles.includes(role._id)}
                            onCheckedChange={() => handleRoleToggle(role._id)}
                            disabled={loading || deleting}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`role-${role._id}`}
                              className="cursor-pointer font-medium text-sm flex items-center gap-2"
                            >
                              {role.title}
                              {role.is_system && (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  System
                                </Badge>
                              )}
                            </Label>
                            {role.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {role.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No roles available
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4">
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={handleDeleteUser}
                    disabled={deleting || loading || isSystemUser}
                    title={
                      isSystemUser
                        ? "System users cannot be deleted"
                        : "Delete this user"
                    }
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>Delete User</>
                    )}
                  </Button>
                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => router.push("/dashboard/users")}
                      disabled={loading || deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={handleUpdateUser}
                      disabled={loading || deleting}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>Update User</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
