"use client";

import {
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
} from "@/hooks/usePermission";
import { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback,
}: ProtectedRouteProps) {
  const hasSinglePermission = useHasPermission(requiredPermission || "");
  const hasAnyPermissions = useHasAnyPermission(requiredPermissions || []);
  const hasAllPermissions = useHasAllPermissions(requiredPermissions || []);

  const defaultFallback = (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        You don&apos;t have permission to access this content.
      </AlertDescription>
    </Alert>
  );

  const displayFallback = fallback || defaultFallback;

  if (requiredPermission) {
    if (!hasSinglePermission) {
      return <>{displayFallback}</>;
    }
    return <>{children}</>;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAll) {
      if (!hasAllPermissions) {
        return <>{displayFallback}</>;
      }
    } else {
      if (!hasAnyPermissions) {
        return <>{displayFallback}</>;
      }
    }
  }

  return <>{children}</>;
}
