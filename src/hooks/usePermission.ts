"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface Permission {
    key: string;
    resource: string;
    action: string;
}

interface UserPermissions {
    permissions: string[];
    loading: boolean;
}

export function usePermissions(): UserPermissions {
    const { data: session } = useSession();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPermissions() {
            if (!session?.user?.id) {
                setPermissions([]);
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/users/${session.user.id}/permissions`);
                const data = await res.json();

                if (data.success && data.data) {
                    setPermissions(data.data.map((p: Permission) => p.key));
                }
            } catch (error) {
                console.error("Failed to fetch permissions:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchPermissions();
    }, [session?.user?.id]);

    return { permissions, loading };
}

export function useHasPermission(permissionKey: string): boolean {
    const { permissions } = usePermissions();
    return permissions.includes(permissionKey);
}

export function useHasAnyPermission(permissionKeys: string[]): boolean {
    const { permissions } = usePermissions();
    return permissionKeys.some(key => permissions.includes(key));
}

export function useHasAllPermissions(permissionKeys: string[]): boolean {
    const { permissions } = usePermissions();
    return permissionKeys.every(key => permissions.includes(key));
}

export function useHasPermissionPattern(pattern: string): boolean {
    const { permissions } = usePermissions();
    return permissions.some(p => p.startsWith(pattern));
}