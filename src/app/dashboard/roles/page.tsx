"use client";

import { useEffect, useState } from "react";
import { Role } from "@/types/role";
import { User } from "@/types/user";
import { UserRole } from "@/types/userRole";
import { Permission } from "@/types/permission";
import { Button } from "@/components/ui/button";
import { RolePermission } from "@/types/rolePermission";
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
import { Input } from "@/components/ui/input";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  const [newRoleTitle, setNewRoleTitle] = useState<string>("");
  const [newRoleDesc, setNewRoleDesc] = useState<string>("");

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.success) setRoles(data.data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/user-roles");
      const data = await res.json();
      if (data.success) setAssignments(data.data);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/permissions");
      const data = await res.json();
      if (data.success) setPermissions(data.data);
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const res = await fetch("/api/role-permissions");
      const data = await res.json();
      if (data.success) setRolePermissions(data.data);
    } catch (err) {
      console.error("Error fetching role-permissions:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchRoles();
      await fetchUsers();
      await fetchAssignments();
      await fetchPermissions();
      await fetchRolePermissions();
    }
    loadData();
  }, []);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const res = await fetch("/api/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUser, role_id: selectedRole }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAssignments();
        setSelectedUser("");
        setSelectedRole("");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error assigning role:", err);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleTitle) return;
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newRoleTitle, description: newRoleDesc }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRoles();
        setNewRoleTitle("");
        setNewRoleDesc("");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error creating role:", err);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Roles Management</h1>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Role Title"
          value={newRoleTitle}
          onChange={(e) => setNewRoleTitle(e.target.value)}
        />
        <Input
          placeholder="Description"
          value={newRoleDesc}
          onChange={(e) => setNewRoleDesc(e.target.value)}
        />
        <Button onClick={handleCreateRole}>Create Role</Button>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-6">Assign Role to User</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <Select onValueChange={setSelectedUser} value={selectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <Button onClick={handleAssignRole}>Assign</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto mt-6">
        <table className="w-full table-auto border-collapse border border-border">
          <thead>
            <tr className="bg-muted/20">
              <th className="border border-border px-4 py-2 text-left">Role</th>
              <th className="border border-border px-4 py-2 text-left">
                Description
              </th>
              <th className="border border-border px-4 py-2 text-left">
                Users
              </th>
              <th className="border border-border px-4 py-2 text-left">
                Permissions
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role._id} className="hover:bg-muted/10">
                <td className="border border-border px-4 py-2">{role.title}</td>
                <td className="border border-border px-4 py-2">
                  {role.description}
                </td>
                <td className="border border-border px-4 py-2">
                  {assignments
                    .filter((a) => a.role_id._id === role._id)
                    .map((a) => a.user_id.name)
                    .join(", ") || "-"}
                </td>
                <td className="border border-border px-4 py-2">
                  {rolePermissions
                    .filter((rp) => rp.role_id._id === role._id)
                    .map((rp) => rp.permission_id.resource)
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
