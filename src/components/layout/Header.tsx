"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Image from "next/image";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const isLoggedIn = !!session?.user;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Desktop Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/Logo-with-Text.svg"
            alt="Sentra Logo"
            width={120}
            height={30}
            priority
            className="h-8 w-auto" // Sizing for the desktop header bar
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {!isLoggedIn ? (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" className="font-medium">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="font-medium">Create Account</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="font-medium">
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="destructive"
                className="font-medium"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Hamburger Menu */}
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

              {/* ✅ FIX: Added Logo inside the mobile menu */}
              <div className="mb-6 flex justify-center border-b pb-6">
                <Link href="/" onClick={() => setOpen(false)}>
                  <Image
                    src="/Logo-with-Text.svg"
                    alt="Sentra Logo"
                    width={150}
                    height={35}
                    priority
                    className="h-9 w-auto" // Sizing for inside the menu
                  />
                </Link>
              </div>

              <nav className="flex flex-col gap-3">
                {!isLoggedIn ? (
                  <>
                    <Link href="/auth/login" onClick={() => setOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start font-medium"
                      >
                        Log in
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setOpen(false)}>
                      <Button className="w-full justify-start font-medium">
                        Create Account
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start font-medium"
                      >
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      className="w-full justify-start font-medium"
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                    >
                      Logout
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
