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
    <header className="w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/Logo-with-Text.svg"
            alt="Sentra Logo"
            width={120}
            height={30}
            priority
            className="h-8"
          />
        </Link>

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

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="flex flex-col p-6">
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Access login, signup, and dashboard navigation
                </SheetDescription>
              </SheetHeader>

              <nav className="flex flex-col gap-3 mt-4">
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
