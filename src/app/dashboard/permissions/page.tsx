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
  Input,
} from "@/components/ui/input";
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
  const [selectedPermission, setSelectedPermission] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  const [newResource, setNewResource] = useState<string>("");
  const [newActions, setNewActions] = useState<string>("");

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/permissions");
      const data = await res.json();
      if (data.success) setPermissions(data.data);
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.success) setRoles(data.data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/role-permissions");
      const data = await res.json();
      if (data.success) setAssignments(data.data);
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

  // Assign permission to role
  const handleAssignPermission = async () => {
    if (!selectedPermission || !selectedRole) return;

    try {
      const res = await fetch("/api/role-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: selectedRole, permission_id: selectedPermission }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAssignments();
        setSelectedPermission("");
        setSelectedRole("");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error assigning permission:", err);
    }
  };

  // Create a new permission
  const handleCreatePermission = async () => {
    if (!newResource || !newActions) return;

    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: newResource,
          actions: newActions.split(",").map((a) => a.trim()),
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPermissions();
        setNewResource("");
        setNewActions("");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error creating permission:", err);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">Permissions Management</h1>

      <div className="flex gap-4 mb-6">
        {/* Create Permission Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create New Permission</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Permission</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <Input
                placeholder="Resource name (e.g., posts)"
                value={newResource}
                onChange={(e) => setNewResource(e.target.value)}
              />
              <Input
                placeholder="Actions (comma separated, e.g., create,read,update,delete)"
                value={newActions}
                onChange={(e) => setNewActions(e.target.value)}
              />
              <Button onClick={handleCreatePermission}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Permission Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Assign Permission to Role</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign Permission</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 mt-4">
              <Select onValueChange={setSelectedRole} value={selectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setSelectedPermission} value={selectedPermission}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Permission" />
                </SelectTrigger>
                <SelectContent>
                  {permissions.map((perm) => (
                    <SelectItem key={perm._id} value={perm._id}>
                      {perm.resource} ({perm.actions.join(", ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleAssignPermission}>Assign</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Permissions Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse border border-border">
          <thead>
            <tr className="bg-muted/20">
              <th className="border border-border px-4 py-2 text-left">Permission</th>
              <th className="border border-border px-4 py-2 text-left">Actions</th>
              <th className="border border-border px-4 py-2 text-left">Assigned Roles</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr key={perm._id} className="hover:bg-muted/10">
                <td className="border border-border px-4 py-2">{perm.resource}</td>
                <td className="border border-border px-4 py-2">{perm.actions.join(", ")}</td>
                <td className="border border-border px-4 py-2">
                  {assignments
                    .filter((a) => a.permission_id._id === perm._id)
                    .map((a) => a.role_id.title)
                    .join(", ") || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
