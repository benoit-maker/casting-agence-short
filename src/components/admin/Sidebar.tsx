"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, Users, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface SidebarProps {
  profile: Profile;
}

const navItems = [
  { href: "/admin", label: "Mes castings", icon: ClipboardList },
  { href: "/admin/actors", label: "Acteurs", icon: Users },
];

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin">
          <Logo className="text-2xl" />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-btn text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        {profile.role === "super_admin" && (
          <Link
            href="/admin/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-btn text-sm font-medium transition-colors",
              pathname.startsWith("/admin/settings")
                ? "bg-primary-light text-primary"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Settings className="w-5 h-5" />
            Paramètres
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-dark truncate">
              {profile.full_name}
            </p>
            <p className="text-xs text-gray-400 truncate">{profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-btn transition-colors cursor-pointer"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
