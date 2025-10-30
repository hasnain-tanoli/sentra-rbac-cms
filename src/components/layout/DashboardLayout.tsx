// src/components/layout/DashboardLayout.tsx
import HeaderDashboard from "./HeaderDashboard";
import FooterDashboard from "./FooterDashboard";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <HeaderDashboard />
        <main className="p-6 flex-1">{children}</main>
        <FooterDashboard />
      </div>
    </div>
  );
}
