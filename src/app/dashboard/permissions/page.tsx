"use client";

import { useEffect, useState } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<RolePermission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/permissions");
      const data = await res.json();
      if (data.success) setPermissions(data.data || []);
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.success) setRoles(data.data || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/role-permissions");
      const data = await res.json();
      if (data.success) setAssignments(data.data || []);
    } catch (err) {
      console.error("Error fetching role-permissions:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchPermissions();
      await fetchRoles();
      await fetchAssignments();
    }
    loadData();
  }, []);

  const handleAssignPermissions = async () => {
    if (!selectedRole || selectedPermissions.length === 0) {
      alert("Please select a role and at least one permission");
      return;
    }

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
        alert(
          `${data.data.assignedCount} permission(s) assigned successfully!`
        );
        fetchAssignments();
        setSelectedPermissions([]);
        setSelectedRole("");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error assigning permissions:", err);
      alert("Failed to assign permissions");
    }
  };

  const togglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey)
        ? prev.filter((k) => k !== permKey)
        : [...prev, permKey]
    );
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">Permissions Management</h1>

      <div className="flex gap-4 mb-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Assign Permissions to Role</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Permissions to Role</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 mt-4">
              <Select onValueChange={setSelectedRole} value={selectedRole}>
                <SelectTrigger>
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

              <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                <p className="text-sm font-medium mb-3">
                  Select Permissions ({selectedPermissions.length} selected):
                </p>
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
                        <span className="text-sm">
                          <span className="font-medium">{perm.resource}</span>{" "}
                          <span className="text-muted-foreground">→</span>{" "}
                          <span className="text-primary">{perm.action}</span>
                        </span>
                      </label>
                    ))}
                </div>
              </div>

              <Button
                onClick={handleAssignPermissions}
                disabled={!selectedRole || selectedPermissions.length === 0}
              >
                Assign {selectedPermissions.length} Permission(s)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse border border-border">
          <thead>
            <tr className="bg-muted/20">
              <th className="border border-border px-4 py-2 text-left">
                Resource
              </th>
              <th className="border border-border px-4 py-2 text-left">
                Action
              </th>
              <th className="border border-border px-4 py-2 text-left">Key</th>
              <th className="border border-border px-4 py-2 text-left">
                Assigned Roles
              </th>
            </tr>
          </thead>
          <tbody>
            {permissions
              .filter((perm) => perm && perm._id)
              .map((perm) => (
                <tr key={perm._id} className="hover:bg-muted/10">
                  <td className="border border-border px-4 py-2 capitalize">
                    {perm.resource}
                  </td>
                  <td className="border border-border px-4 py-2 capitalize">
                    {perm.action}
                  </td>
                  <td className="border border-border px-4 py-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {perm.key}
                    </code>
                  </td>
                  <td className="border border-border px-4 py-2">
                    {assignments
                      .filter(
                        (a) =>
                          a &&
                          a.permission_id &&
                          a.permission_id._id === perm._id &&
                          a.role_id &&
                          a.role_id.title
                      )
                      .map((a) => a.role_id.title)
                      .join(", ") || "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
