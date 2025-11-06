// components/auth/ProtectedRoute.tsx
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
  // Call hooks at the top level
  const hasSinglePermission = useHasPermission(requiredPermission || "");
  const hasAnyPermissions = useHasAnyPermission(requiredPermissions || []);
  const hasAllPermissions = useHasAllPermissions(requiredPermissions || []);

  // Default fallback
  const defaultFallback = (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        You don&apos;t have permission to access this content.
      </AlertDescription>
    </Alert>
  );

  const displayFallback = fallback || defaultFallback;

  // Single permission check
  if (requiredPermission) {
    if (!hasSinglePermission) {
      return <>{displayFallback}</>;
    }
    return <>{children}</>;
  }

  // Multiple permissions check
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
