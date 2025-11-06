"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { use } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Role } from "@/types/role";

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

  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching user and role data for ID:", id);

        const userRes = await fetch(`/api/users?id=${id}`);
        const userData = await userRes.json();
        if (!userData.success || !userData.data) {
          alert("Failed to fetch user details");
          router.push("/dashboard/users");
          return;
        }

        const user = userData.data;
        setName(user.name || "");
        setEmail(user.email || "");

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
        alert("Failed to fetch required data");
        router.push("/dashboard/users");
      } finally {
        setFetchLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  const handleUpdateUser = async () => {
    if (!name || !email) {
      alert("Name and email are required");
      return;
    }

    const roleKeys = selectedRoles.map((roleId) => {
      const role = roles.find((r) => r._id === roleId);
      return role ? role.key : "";
    }).filter(key => key !== "");

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
        alert("User updated successfully!");
        router.push("/dashboard/users");
      } else {
        alert(data.message || "Failed to update user");
      }
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
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
        alert("User deleted successfully!");
        router.push("/dashboard/users");
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("An error occurred while deleting the user.");
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
        <div className="flex justify-center items-center h-64">
          <p>Loading user details...</p>
        </div>
      </DashboardLayout>
    );
  }

  const selectedSet = new Set(selectedRoles.map(String));
  const assignedRoles = roles.filter((role) => selectedSet.has(role._id));

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-md shadow-md">
        <h1 className="text-2xl font-bold mb-6">Edit User</h1>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Name"
            value={name || ""}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={email || ""}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">
              Currently Assigned Roles
            </h2>
            <div className="mb-4 p-3 border rounded-md bg-gray-50">
              {assignedRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assignedRoles.map((role) => (
                    <span
                      key={`assigned-${role._id}`}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      {role.title}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No roles assigned</p>
              )}
            </div>

            <h2 className="text-lg font-semibold mb-2">Manage User Roles</h2>
            <div className="space-y-2">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <div key={role._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role._id}`}
                      checked={selectedRoles.includes(role._id)}
                      onCheckedChange={() => handleRoleToggle(role._id)}
                    />
                    <Label
                      htmlFor={`role-${role._id}`}
                      className="cursor-pointer"
                    >
                      {role.title}
                      {role.description && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({role.description})
                        </span>
                      )}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No roles available</p>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/users")}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
              <Button onClick={handleUpdateUser} disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
