"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, FileText, Users, Key, Shield, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/usePermission";
import { PERMISSION_KEYS } from "@/lib/constants/permissions";
import { useMemo } from "react";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  requireManagePermissions?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { permissions, hasPermission, loading } = usePermissions();

  const menu: MenuItem[] = useMemo(
    () => [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        requireManagePermissions: true,
      },
      {
        name: "Posts",
        href: "/dashboard/posts",
        icon: FileText,
        requireManagePermissions: true,
      },
      {
        name: "Users",
        href: "/dashboard/users",
        icon: Users,
        permission: PERMISSION_KEYS.USERS_READ,
      },
      {
        name: "Roles",
        href: "/dashboard/roles",
        icon: Key,
        permission: PERMISSION_KEYS.ROLES_READ,
      },
      {
        name: "Permissions",
        href: "/dashboard/permissions",
        icon: Shield,
        permission: PERMISSION_KEYS.PERMISSIONS_READ,
      },
    ],
    []
  );

  const hasOnlyPostsRead = useMemo(
    () =>
      permissions.length === 1 && permissions[0] === PERMISSION_KEYS.POSTS_READ,
    [permissions]
  );

  const canManagePosts = useMemo(
    () =>
      hasPermission(PERMISSION_KEYS.POSTS_CREATE) ||
      hasPermission(PERMISSION_KEYS.POSTS_UPDATE) ||
      hasPermission(PERMISSION_KEYS.POSTS_DELETE),
    [hasPermission]
  );

  const hasDashboardAccess = useMemo(() => {
    const canManageUsers =
      hasPermission(PERMISSION_KEYS.USERS_CREATE) ||
      hasPermission(PERMISSION_KEYS.USERS_READ) ||
      hasPermission(PERMISSION_KEYS.USERS_UPDATE) ||
      hasPermission(PERMISSION_KEYS.USERS_DELETE);

    const canManageRoles =
      hasPermission(PERMISSION_KEYS.ROLES_CREATE) ||
      hasPermission(PERMISSION_KEYS.ROLES_READ) ||
      hasPermission(PERMISSION_KEYS.ROLES_UPDATE) ||
      hasPermission(PERMISSION_KEYS.ROLES_DELETE);

    const canManagePermissions =
      hasPermission(PERMISSION_KEYS.PERMISSIONS_CREATE) ||
      hasPermission(PERMISSION_KEYS.PERMISSIONS_READ) ||
      hasPermission(PERMISSION_KEYS.PERMISSIONS_UPDATE) ||
      hasPermission(PERMISSION_KEYS.PERMISSIONS_DELETE);

    return (
      canManagePosts || canManageUsers || canManageRoles || canManagePermissions
    );
  }, [hasPermission, canManagePosts]);

  const visibleMenu = useMemo(
    () =>
      menu.filter((item) => {
        // Hide all items for users with only posts.read
        if (hasOnlyPostsRead) {
          return false;
        }

        // For items requiring manage permissions
        if (item.requireManagePermissions) {
          if (item.name === "Posts") {
            return canManagePosts;
          }
          if (item.name === "Dashboard") {
            return hasDashboardAccess;
          }
        }

        // For items with specific permission requirements
        if (item.permission) {
          return hasPermission(item.permission);
        }

        return true;
      }),
    [menu, hasOnlyPostsRead, canManagePosts, hasDashboardAccess, hasPermission]
  );

  return (
    <aside className="w-64 border-r bg-background/90 p-6 hidden md:flex flex-col gap-4">
      <div className="mb-8 flex justify-center">
        <Image
          src="/Logo-with-Text.svg"
          alt="Sentra Logo"
          width={180}
          height={40}
          priority
          style={{ height: "auto" }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : visibleMenu.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No accessible pages</p>
        </div>
      ) : (
        <nav className="flex flex-col gap-2">
          {visibleMenu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-primary/10"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      )}
    </aside>
  );
}
