"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
// import Image from "next/image";

export default function HeaderDashboard() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-end px-6 py-4">
        {/* Logo
        <Link href="/" className="flex items-center">
          <Image
            src="/Logo.svg"
            alt="Sentra Logo"
            width={120}
            height={30}
            priority
            className="h-8 w-auto"
          />
        </Link> */}

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="font-medium">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button className="font-medium">Create Account</Button>
          </Link>
        </nav>

        {/* Mobile navigation */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-3 p-6">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start font-medium"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button className="w-full justify-start font-medium">
                  Create Account
                </Button>
              </Link>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
