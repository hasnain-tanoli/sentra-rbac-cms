"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function HeaderDashboard() {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-end px-6 py-4">
        <Button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="font-medium"
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
