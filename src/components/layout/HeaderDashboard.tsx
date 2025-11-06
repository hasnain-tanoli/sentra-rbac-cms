"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, User } from "lucide-react";

export default function HeaderDashboard() {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Button variant="outline" className="font-medium">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
