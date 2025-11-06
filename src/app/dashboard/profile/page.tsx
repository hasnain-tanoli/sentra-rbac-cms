"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Shield, Key, Loader2 } from "lucide-react";

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

interface UserData {
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
}

function errorMessage(err: unknown, fallback = "Unexpected error"): string {
  return err instanceof Error ? err.message : fallback;
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    const ct = res.headers.get("content-type");
    if (!ct || !ct.includes("application/json")) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { toast } = useToast();

  const roleVariantMap: Record<
    string,
    "destructive" | "secondary" | "default" | "outline"
  > = {
    admin: "destructive",
    manager: "secondary",
    editor: "default",
    moderator: "outline",
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setFetchError(null);

        const response = await fetch(`/api/users?email=${session.user.email}`);
        const data = await safeJson<ApiResponse<UserData>>(response);

        if (response.ok && data?.success && data.data) {
          setUserData(data.data);
        } else {
          const msg = data?.message || "Failed to fetch user data";
          setFetchError(msg);
          toast({
            title: "Error",
            description: msg,
            variant: "destructive",
          });
        }
      } catch (err: unknown) {
        const msg = errorMessage(err, "Network error loading profile");
        setFetchError(msg);
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUserData();
  }, [session?.user?.email, toast]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            View your account details and permissions
          </p>
        </div>

        {fetchError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
              Loading profile...
            </span>
          </div>
        ) : !userData ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Unable to load profile data.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your account details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="text-lg font-medium">
                      {userData.name || "Not available"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-lg font-medium">
                      {userData.email || "Not available"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Access Control
                </CardTitle>
                <CardDescription>
                  Your assigned roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Roles
                    </p>
                  </div>
                  {userData.roles && userData.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userData.roles.map((role: Role) => (
                        <Badge
                          key={role._id}
                          variant={
                            roleVariantMap[role.title.toLowerCase()] ??
                            "default"
                          }
                          className="px-3 py-1.5 text-sm cursor-default"
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
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Permissions
                    </p>
                  </div>
                  {userData.permissions && userData.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userData.permissions.map((perm: Permission) => (
                        <Badge
                          key={perm._id}
                          variant="outline"
                          className="px-3 py-1.5 text-sm cursor-default font-mono"
                          title={perm.description || ""}
                        >
                          {perm.resource}.{perm.action}
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
        )}
      </div>
    </DashboardLayout>
  );
}
