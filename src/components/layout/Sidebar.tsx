"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, FileText, Users, Key, Shield, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/usePermission";
import { PERMISSION_KEYS } from "@/lib/constants/permissions";
import { useMemo, memo } from "react";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  requireManagePermissions?: boolean;
}

const LogoSection = memo(() => (
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
));
LogoSection.displayName = "LogoSection";

const LoadingState = memo(() => (
  <div className="flex items-center justify-center py-4">
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
));
LoadingState.displayName = "LoadingState";

const EmptyState = memo(() => (
  <div className="text-center py-8">
    <p className="text-sm text-muted-foreground">No accessible pages</p>
  </div>
));
EmptyState.displayName = "EmptyState";

const NavItem = memo(
  ({ item, isActive }: { item: MenuItem; isActive: boolean }) => {
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${
          isActive
            ? "bg-primary text-white"
            : "text-foreground hover:bg-primary/10"
        }`}
      >
        <Icon className="h-5 w-5" />
        {item.name}
      </Link>
    );
  }
);
NavItem.displayName = "NavItem";

const NavMenu = memo(
  ({ items, currentPath }: { items: MenuItem[]; currentPath: string }) => {
    if (items.length === 0) {
      return <EmptyState />;
    }

    return (
      <nav className="flex flex-col gap-2">
        {items.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isActive={currentPath === item.href}
          />
        ))}
      </nav>
    );
  }
);
NavMenu.displayName = "NavMenu";

export default function Sidebar() {
  const pathname = usePathname();
  const { permissions, hasPermission, loading } = usePermissions();

  const menuItems: MenuItem[] = useMemo(
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

  const canManageUsers = useMemo(
    () =>
      hasPermission(PERMISSION_KEYS.USERS_CREATE) ||
      hasPermission(PERMISSION_KEYS.USERS_READ) ||
      hasPermission(PERMISSION_KEYS.USERS_UPDATE) ||
      hasPermission(PERMISSION_KEYS.USERS_DELETE),
    [hasPermission]
  );

  const canManageRoles = useMemo(
    () =>
      hasPermission(PERMISSION_KEYS.ROLES_CREATE) ||
      hasPermission(PERMISSION_KEYS.ROLES_READ) ||
      hasPermission(PERMISSION_KEYS.ROLES_UPDATE) ||
      hasPermission(PERMISSION_KEYS.ROLES_DELETE),
    [hasPermission]
  );

  const canManagePermissions = useMemo(
    () =>
      hasPermission(PERMISSION_KEYS.PERMISSIONS_CREATE) ||
      hasPermission(PERMISSION_KEYS.PERMISSIONS_READ) ||
      hasPermission(PERMISSION_KEYS.PERMISSIONS_UPDATE) ||
      hasPermission(PERMISSION_KEYS.PERMISSIONS_DELETE),
    [hasPermission]
  );

  const hasDashboardAccess = useMemo(() => {
    return (
      canManagePosts || canManageUsers || canManageRoles || canManagePermissions
    );
  }, [canManagePosts, canManageUsers, canManageRoles, canManagePermissions]);

  const visibleMenu = useMemo(() => {
    if (hasOnlyPostsRead) {
      return [];
    }

    return menuItems.filter((item) => {
      if (item.requireManagePermissions) {
        if (item.name === "Posts") {
          return canManagePosts;
        }
        if (item.name === "Dashboard") {
          return hasDashboardAccess;
        }
        return false;
      }

      if (item.permission) {
        return hasPermission(item.permission);
      }

      return true;
    });
  }, [
    menuItems,
    hasOnlyPostsRead,
    canManagePosts,
    hasDashboardAccess,
    hasPermission,
  ]);

  return (
    <aside className="w-64 border-r bg-background/90 p-6 hidden md:flex flex-col gap-4">
      <LogoSection />

      {loading ? (
        <LoadingState />
      ) : (
        <NavMenu items={visibleMenu} currentPath={pathname} />
      )}
    </aside>
  );
}
