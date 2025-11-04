"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/types/user";
import { Role } from "@/types/role";
import { Permission } from "@/types/permission";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const roleVariantMap: Record<
    string,
    "destructive" | "secondary" | "default" | "outline"
  > = {
    admin: "destructive",
    manager: "secondary",
    editor: "default",
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.email) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/users?email=${session.user.email}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        const data = await response.json();
        if (data.success && data.data) {
          setUserData(data.data as User);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your account details and personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-[250px]" />
                <Skeleton className="h-6 w-[200px]" />
                <Skeleton className="h-6 w-[300px]" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-lg">{userData?.name ?? "Not available"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-lg">
                    {userData?.email ?? "Not available"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles & Permissions</CardTitle>
            <CardDescription>
              Your assigned roles and access permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Roles
              </p>
              {isLoading ? (
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ) : userData?.roles && userData.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userData.roles.map((role: Role) => (
                    <Badge
                      key={role._id}
                      variant={
                        roleVariantMap[role.title.toLowerCase()] ?? "default"
                      }
                      className="px-3 py-1 text-sm cursor-default"
                      title={role.description || ""}
                    >
                      {role.title}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No roles assigned
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Permissions
              </p>
              {isLoading ? (
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-28" />
                </div>
              ) : userData?.permissions && userData.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userData.permissions.map((perm: Permission) => (
                    <Badge
                      key={perm._id}
                      variant="outline"
                      className="px-3 py-1 text-sm cursor-default"
                      title={perm.description || ""}
                    >
                      {perm.resource} [{perm.action}]
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No permissions assigned
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
