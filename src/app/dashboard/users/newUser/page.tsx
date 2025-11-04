"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewUserPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleCreateUser = async () => {
    if (!name || !email || !password) {
      alert("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        alert("User created successfully!");
        router.push("/dashboard/users");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Failed to create user:", err);
      alert("Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-md shadow-md">
        <h1 className="text-2xl font-bold mb-6">Create New User</h1>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/users")}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
