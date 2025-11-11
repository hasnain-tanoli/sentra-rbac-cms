"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

interface Permission {
    key: string;
    resource: string;
    action: string;
}

interface UserPermissions {
    permissions: string[];
    loading: boolean;
    hasPermission: (key: string) => boolean;
    hasAnyPermission: (keys: string[]) => boolean;
    hasAllPermissions: (keys: string[]) => boolean;
    hasPermissionPattern: (pattern: string) => boolean;
}

export function usePermissions(): UserPermissions {
    const { data: session } = useSession();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPermissions() {
            if (!session?.user?.email) {
                setPermissions([]);
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/users?email=${session.user.email}`);
                const data = await res.json();

                if (data.success && data.data?.permissions) {
                    const permKeys = data.data.permissions.map((p: Permission) => p.key);
                    setPermissions(permKeys);
                } else {
                    setPermissions([]);
                }
            } catch (error) {
                console.error("Failed to fetch permissions:", error);
                setPermissions([]);
            } finally {
                setLoading(false);
            }
        }

        fetchPermissions();
    }, [session?.user?.email]);

    const hasPermission = useCallback(
        (key: string): boolean => {
            return permissions.includes(key);
        },
        [permissions]
    );

    const hasAnyPermission = useCallback(
        (keys: string[]): boolean => {
            return keys.some((key) => permissions.includes(key));
        },
        [permissions]
    );

    const hasAllPermissions = useCallback(
        (keys: string[]): boolean => {
            return keys.every((key) => permissions.includes(key));
        },
        [permissions]
    );

    const hasPermissionPattern = useCallback(
        (pattern: string): boolean => {
            return permissions.some((p) => p.startsWith(pattern));
        },
        [permissions]
    );

    return {
        permissions,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasPermissionPattern,
    };
}

export function useHasPermission(permissionKey: string): boolean {
    const { hasPermission } = usePermissions();
    return hasPermission(permissionKey);
}

export function useHasAnyPermission(permissionKeys: string[]): boolean {
    const { hasAnyPermission } = usePermissions();
    return hasAnyPermission(permissionKeys);
}

export function useHasAllPermissions(permissionKeys: string[]): boolean {
    const { hasAllPermissions } = usePermissions();
    return hasAllPermissions(permissionKeys);
}

export function useHasPermissionPattern(pattern: string): boolean {
    const { hasPermissionPattern } = usePermissions();
    return hasPermissionPattern(pattern);
}