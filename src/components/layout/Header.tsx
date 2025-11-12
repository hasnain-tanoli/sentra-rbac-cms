"use client";

import Link from "next/link";
import { useState, useMemo, useCallback, memo } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePermissions } from "@/hooks/usePermission";
import { PERMISSION_KEYS } from "@/lib/constants/permissions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, FileText, LayoutDashboard } from "lucide-react";
import Image from "next/image";

const LogoLink = memo(
  ({
    onClick,
    width = 120,
    height = 30,
    className = "h-8 w-auto",
  }: {
    onClick?: () => void;
    width?: number;
    height?: number;
    className?: string;
  }) => (
    <Link href="/" onClick={onClick} className="flex items-center">
      <Image
        src="/Logo-with-Text.svg"
        alt="Sentra Logo"
        width={width}
        height={height}
        priority
        className={className}
      />
    </Link>
  )
);
LogoLink.displayName = "LogoLink";

const GuestActions = memo(
  ({ isMobile, onClose }: { isMobile?: boolean; onClose?: () => void }) => (
    <>
      <Link href="/auth/login" onClick={onClose}>
        <Button
          variant="ghost"
          className={`font-medium ${isMobile ? "w-full justify-start" : ""}`}
        >
          Log in
        </Button>
      </Link>
      <Link href="/auth/signup" onClick={onClose}>
        <Button
          className={`font-medium ${isMobile ? "w-full justify-start" : ""}`}
        >
          Create Account
        </Button>
      </Link>
    </>
  )
);
GuestActions.displayName = "GuestActions";

const LoadingAction = memo(({ isMobile }: { isMobile?: boolean }) => (
  <Button
    variant="ghost"
    disabled
    className={`font-medium ${isMobile ? "w-full justify-start" : ""}`}
  >
    Loading...
  </Button>
));
LoadingAction.displayName = "LoadingAction";

const PostsOnlyActions = memo(
  ({
    isMobile,
    onClose,
    onLogout,
  }: {
    isMobile?: boolean;
    onClose?: () => void;
    onLogout: () => void;
  }) => (
    <>
      <Link href="/posts" onClick={onClose}>
        <Button
          variant="ghost"
          className={`font-medium gap-2 ${
            isMobile ? "w-full justify-start" : ""
          }`}
        >
          <FileText className="h-4 w-4" />
          View Posts
        </Button>
      </Link>
      <Button
        variant="destructive"
        className={`font-medium ${isMobile ? "w-full justify-start" : ""}`}
        onClick={onLogout}
      >
        Logout
      </Button>
    </>
  )
);
PostsOnlyActions.displayName = "PostsOnlyActions";

const DashboardActions = memo(
  ({
    isMobile,
    onClose,
    onLogout,
  }: {
    isMobile?: boolean;
    onClose?: () => void;
    onLogout: () => void;
  }) => (
    <>
      <Link href="/dashboard" onClick={onClose}>
        <Button
          variant="ghost"
          className={`font-medium gap-2 ${
            isMobile ? "w-full justify-start" : ""
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Button
        variant="destructive"
        className={`font-medium ${isMobile ? "w-full justify-start" : ""}`}
        onClick={onLogout}
      >
        Logout
      </Button>
    </>
  )
);
DashboardActions.displayName = "DashboardActions";

const LogoutOnlyAction = memo(
  ({ isMobile, onLogout }: { isMobile?: boolean; onLogout: () => void }) => (
    <Button
      variant="destructive"
      className={`font-medium ${isMobile ? "w-full justify-start" : ""}`}
      onClick={onLogout}
    >
      Logout
    </Button>
  )
);
LogoutOnlyAction.displayName = "LogoutOnlyAction";

const DesktopNav = memo(
  ({
    isLoggedIn,
    permsLoading,
    hasOnlyPostsRead,
    hasDashboardAccess,
    onLogout,
  }: {
    isLoggedIn: boolean;
    permsLoading: boolean;
    hasOnlyPostsRead: boolean;
    hasDashboardAccess: boolean;
    onLogout: () => void;
  }) => (
    <nav className="hidden md:flex items-center gap-4">
      {!isLoggedIn ? (
        <GuestActions />
      ) : permsLoading ? (
        <LoadingAction />
      ) : hasOnlyPostsRead ? (
        <PostsOnlyActions onLogout={onLogout} />
      ) : hasDashboardAccess ? (
        <DashboardActions onLogout={onLogout} />
      ) : (
        <LogoutOnlyAction onLogout={onLogout} />
      )}
    </nav>
  )
);
DesktopNav.displayName = "DesktopNav";

const MobileNav = memo(
  ({
    isLoggedIn,
    permsLoading,
    hasOnlyPostsRead,
    hasDashboardAccess,
    onClose,
    onLogout,
  }: {
    isLoggedIn: boolean;
    permsLoading: boolean;
    hasOnlyPostsRead: boolean;
    hasDashboardAccess: boolean;
    onClose: () => void;
    onLogout: () => void;
  }) => (
    <nav className="flex flex-col gap-3">
      {!isLoggedIn ? (
        <GuestActions isMobile onClose={onClose} />
      ) : permsLoading ? (
        <LoadingAction isMobile />
      ) : hasOnlyPostsRead ? (
        <PostsOnlyActions isMobile onClose={onClose} onLogout={onLogout} />
      ) : hasDashboardAccess ? (
        <DashboardActions isMobile onClose={onClose} onLogout={onLogout} />
      ) : (
        <LogoutOnlyAction isMobile onLogout={onLogout} />
      )}
    </nav>
  )
);
MobileNav.displayName = "MobileNav";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const {
    permissions,
    hasPermission,
    loading: permsLoading,
  } = usePermissions();

  const isLoggedIn = useMemo(() => !!session?.user, [session?.user]);

  const hasOnlyPostsRead = useMemo(() => {
    return (
      permissions.length === 1 && permissions[0] === PERMISSION_KEYS.POSTS_READ
    );
  }, [permissions]);

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

  const handleLogout = useCallback(async () => {
    await signOut({ callbackUrl: "/" });
  }, []);

  const handleCloseSheet = useCallback(() => {
    setOpen(false);
  }, []);

  const handleLogoutAndClose = useCallback(() => {
    setOpen(false);
    handleLogout();
  }, [handleLogout]);

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <LogoLink />

        <DesktopNav
          isLoggedIn={isLoggedIn}
          permsLoading={permsLoading}
          hasOnlyPostsRead={hasOnlyPostsRead}
          hasDashboardAccess={hasDashboardAccess}
          onLogout={handleLogout}
        />

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[300px] p-6 sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Access login, signup, and dashboard navigation
                </SheetDescription>
              </SheetHeader>

              <div className="mb-6 flex justify-center border-b pb-6">
                <LogoLink
                  onClick={handleCloseSheet}
                  width={150}
                  height={35}
                  className="h-9 w-auto"
                />
              </div>

              <MobileNav
                isLoggedIn={isLoggedIn}
                permsLoading={permsLoading}
                hasOnlyPostsRead={hasOnlyPostsRead}
                hasDashboardAccess={hasDashboardAccess}
                onClose={handleCloseSheet}
                onLogout={handleLogoutAndClose}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
