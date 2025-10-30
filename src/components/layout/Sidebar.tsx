// src/components/layout/Sidebar.tsx
import Link from "next/link";
import Image from "next/image";
import { Home, FileText, Users, Key, Shield } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Posts", href: "/dashboard/posts", icon: FileText },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Roles", href: "/dashboard/roles", icon: Key },
    { name: "Permissions", href: "/dashboard/permissions", icon: Shield },
  ];

  return (
    <aside className="w-64 border-r bg-background/90 p-6 hidden md:flex flex-col gap-4">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <Image
          src="/Logo-with-Text.svg" // replace with your logo path
          alt="Sentra Logo"
          width={180}   // adjust as needed
          height={40}   // adjust as needed
          priority
        />
      </div>

      <nav className="flex flex-col gap-2">
        {menu.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition ${
                isActive
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-primary/10"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
