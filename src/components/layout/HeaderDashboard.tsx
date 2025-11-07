"use client";

import { useState } from "react";
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
import { Home, User, Menu, FileText, Users, Key, Shield } from "lucide-react";
import { usePathname } from "next/navigation";

export default function HeaderDashboard() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Posts", href: "/dashboard/posts", icon: FileText },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Roles", href: "/dashboard/roles", icon: Key },
    { name: "Permissions", href: "/dashboard/permissions", icon: Shield },
  ];

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
                {/* ✅ Added SheetDescription for accessibility */}
                <SheetDescription className="sr-only">
                  Navigate through dashboard pages and manage your account
                </SheetDescription>
              </SheetHeader>

              {/* Logo */}
              <div className="mb-8 flex justify-center">
                <Image
                  src="/Logo-with-Text.svg"
                  alt="Sentra Logo"
                  width={150}
                  height={35}
                  priority
                  style={{ height: "auto" }} // ✅ Fixed aspect ratio warning
                />
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2 mb-6">
                {menuItems.map((item) => {
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

              {/* Mobile Actions */}
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
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/auth/login" });
                  }}
                  className="w-full justify-start font-medium"
                  variant="destructive"
                >
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop - Home Button */}
        <Link href="/" className="hidden md:block">
          <Button variant="outline" className="font-medium">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>

        {/* Mobile - Logo */}
        <div className="md:hidden">
          <Image
            src="/Logo-with-Text.svg"
            alt="Sentra Logo"
            width={100}
            height={25}
            priority
            style={{ height: "auto" }} // ✅ Fixed aspect ratio warning
          />
        </div>

        {/* Desktop - Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard/profile">
            <Button variant="outline" className="font-medium">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
          <Button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="font-medium"
          >
            Log out
          </Button>
        </div>

        {/* Mobile - Logout Button */}
        <Button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="md:hidden font-medium"
          size="sm"
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
