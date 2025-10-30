import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session) {
    redirect("/auth/login");
  }

  // Optional: restrict access by role
  if (!session.user.roles?.includes("admin")) {
    redirect("/403");
  }

  return <DashboardClient />;
}
