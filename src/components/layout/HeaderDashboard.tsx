"use client";

import { useState, useMemo } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  User,
  Menu,
  FileText,
  Users,
  Key,
  Shield,
  Loader2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/usePermission";
import { PERMISSION_KEYS } from "@/lib/constants/permissions";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  requireManagePermissions?: boolean;
}

export default function HeaderDashboard() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { permissions, hasPermission, loading } = usePermissions();

  // Clean logout handler - replaces history to prevent back button issues
  const handleLogout = async () => {
    setOpen(false);
    await signOut({ redirect: false });
    window.location.replace("/auth/login");
  };

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

  const visibleMenuItems = useMemo(
    () =>
      menuItems.filter((item) => {
        if (hasOnlyPostsRead) {
          return false;
        }

        if (item.requireManagePermissions) {
          if (item.name === "Posts") {
            return canManagePosts;
          }
          if (item.name === "Dashboard") {
            return hasDashboardAccess;
          }
        }

        if (item.permission) {
          return hasPermission(item.permission);
        }

        return true;
      }),
    [
      menuItems,
      hasOnlyPostsRead,
      canManagePosts,
      hasDashboardAccess,
      hasPermission,
    ]
  );

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72 p-6">
              <SheetHeader>
                <SheetTitle className="sr-only">
                  Dashboard Navigation
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Navigate through dashboard pages and manage your account
                </SheetDescription>
              </SheetHeader>

              <div className="mb-8 flex justify-center">
                <Image
                  src="/Logo-with-Text.svg"
                  alt="Sentra Logo"
                  width={150}
                  height={35}
                  priority
                  style={{ height: "auto" }}
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : visibleMenuItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No accessible pages
                  </p>
                </div>
              ) : (
                <nav className="flex flex-col gap-2 mb-6">
                  {visibleMenuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium transition ${
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

              <div className="border-t pt-4 mt-auto flex flex-col gap-2">
                <Link href="/dashboard/profile" onClick={() => setOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-medium"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Link href="/" onClick={() => setOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-medium"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  className="w-full justify-start font-medium"
                  variant="destructive"
                >
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Home Button */}
        <Link href="/" className="hidden md:block">
          <Button variant="outline" className="font-medium">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>

        {/* Mobile Logo */}
        <div className="md:hidden">
          <Image
            src="/Logo-with-Text.svg"
            alt="Sentra Logo"
            width={100}
            height={25}
            priority
            style={{ height: "auto" }}
          />
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard/profile">
            <Button variant="outline" className="font-medium">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
          <Button onClick={handleLogout} className="font-medium">
            Log out
          </Button>
        </div>

        {/* Mobile Logout Button */}
        <Button
          onClick={handleLogout}
          className="md:hidden font-medium"
          size="sm"
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
