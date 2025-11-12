"use client";

import { useMemo, memo } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
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

const PersonalInfoCard = memo(
  ({ name, email }: { name: string; email: string }) => (
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
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-lg font-medium">{name || "Not available"}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-lg font-medium">{email || "Not available"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
);
PersonalInfoCard.displayName = "PersonalInfoCard";

const RoleBadge = memo(
  ({
    role,
    variant,
  }: {
    role: Role;
    variant: "destructive" | "secondary" | "default" | "outline";
  }) => (
    <Badge
      variant={variant}
      className="px-3 py-1.5 text-sm cursor-default"
      title={role.description || ""}
    >
      {role.title}
    </Badge>
  )
);
RoleBadge.displayName = "RoleBadge";

const PermissionBadge = memo(({ permission }: { permission: Permission }) => (
  <Badge
    variant="outline"
    className="px-3 py-1.5 text-sm cursor-default font-mono"
    title={permission.description || ""}
  >
    {permission.resource}.{permission.action}
  </Badge>
));
PermissionBadge.displayName = "PermissionBadge";

const RolesSection = memo(({ roles }: { roles: Role[] }) => {
  const roleVariantMap = useMemo<
    Record<string, "destructive" | "secondary" | "default" | "outline">
  >(
    () => ({
      admin: "destructive",
      manager: "secondary",
      editor: "default",
      moderator: "outline",
    }),
    []
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Roles</p>
      </div>
      {roles && roles.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <RoleBadge
              key={role._id}
              role={role}
              variant={roleVariantMap[role.title.toLowerCase()] ?? "default"}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No roles assigned</p>
      )}
    </div>
  );
});
RolesSection.displayName = "RolesSection";

const PermissionsSection = memo(
  ({ permissions }: { permissions: Permission[] }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Key className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Permissions</p>
      </div>
      {permissions && permissions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {permissions.map((perm) => (
            <PermissionBadge key={perm._id} permission={perm} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No permissions assigned</p>
      )}
    </div>
  )
);
PermissionsSection.displayName = "PermissionsSection";

const AccessControlCard = memo(
  ({ roles, permissions }: { roles: Role[]; permissions: Permission[] }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Access Control
        </CardTitle>
        <CardDescription>Your assigned roles and permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RolesSection roles={roles} />
        <PermissionsSection permissions={permissions} />
      </CardContent>
    </Card>
  )
);
AccessControlCard.displayName = "AccessControlCard";

const ErrorMessage = memo(({ message }: { message: string }) => (
  <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-400">
    {message}
  </div>
));
ErrorMessage.displayName = "ErrorMessage";

const LoadingState = memo(() => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-3 text-muted-foreground">Loading profile...</span>
  </div>
));
LoadingState.displayName = "LoadingState";

const EmptyState = memo(() => (
  <Card>
    <CardContent className="py-12 text-center">
      <p className="text-muted-foreground">Unable to load profile data.</p>
    </CardContent>
  </Card>
));
EmptyState.displayName = "EmptyState";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const userEmail = useMemo(() => session?.user?.email, [session?.user?.email]);

  const {
    data: userData,
    error: fetchError,
    isLoading,
  } = useSWR<ApiResponse<UserData>>(
    userEmail ? `/api/users?email=${userEmail}` : null,
    {
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : "Network error loading profile";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      },
    }
  );

  const user = useMemo(() => userData?.data || null, [userData?.data]);

  const roles = useMemo(() => user?.roles || [], [user?.roles]);

  const permissions = useMemo(
    () => user?.permissions || [],
    [user?.permissions]
  );

  const errorMessage = useMemo(() => {
    if (fetchError) {
      return fetchError instanceof Error
        ? fetchError.message
        : "Failed to fetch user data";
    }
    if (userData && !userData.success) {
      return userData.message || "Failed to fetch user data";
    }
    return null;
  }, [fetchError, userData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            View your account details and permissions
          </p>
        </div>

        {errorMessage && <ErrorMessage message={errorMessage} />}

        {isLoading ? (
          <LoadingState />
        ) : !user ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <PersonalInfoCard name={user.name} email={user.email} />
            <AccessControlCard roles={roles} permissions={permissions} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
