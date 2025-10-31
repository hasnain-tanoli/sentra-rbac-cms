"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to view this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center mt-4">
          <Link href="/">
            <Button variant="default">Go to Home Page</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
