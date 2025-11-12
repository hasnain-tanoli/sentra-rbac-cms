import { memo } from "react";
import HeaderDashboard from "./HeaderDashboard";
import FooterDashboard from "./FooterDashboard";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = memo(({ children }: DashboardLayoutProps) => {
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
});

DashboardLayout.displayName = "DashboardLayout";

export default DashboardLayout;
