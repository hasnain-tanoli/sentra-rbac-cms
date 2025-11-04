import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const hasAccess =
    session.user.roles?.includes("super_admin") ||
    session.user.roles?.includes("editor") ||
    session.user.roles?.includes("author");

  if (!hasAccess) {
    redirect("/unauthorized");
  }

  return <DashboardClient />;
}
