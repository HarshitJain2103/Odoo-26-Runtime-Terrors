"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogOut, Bell } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { NAV_ITEMS, ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@prisma/client";

interface TopbarProps {
  userName: string;
  userEmail: string;
  userRole: UserRole;
}

export function Topbar({ userName, userEmail, userRole }: TopbarProps) {
  const pathname = usePathname();

  // Derive page title from pathname
  const currentNav = NAV_ITEMS.find((item) =>
    pathname.startsWith(item.href)
  );
  const pageTitle = currentNav?.label ?? "TransitOps";

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <header
      className="h-14 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-20"
      style={{
        background: "rgba(248,249,251,0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Page title */}
      <div>
        <h1 className="text-base font-semibold text-gray-900 leading-tight">
          {pageTitle}
        </h1>
        <p className="text-xs text-gray-400 leading-tight">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell — placeholder */}
        <button
          className="relative w-8 h-8 rounded-full flex items-center justify-center text-gray-500 transition-colors"
          style={{ background: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Notifications"
          suppressHydrationWarning
        >
          <Bell size={16} />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: "#714b67" }}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-6" style={{ background: "var(--color-border)" }} />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-gray-800 leading-tight">{userName}</p>
            <p className="text-xs leading-tight" style={{ color: "var(--color-primary-500)" }}>
              {ROLE_LABELS[userRole]}
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #714b67, #00a09d)" }}
          >
            {getInitials(userName)}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6" style={{ background: "var(--color-border)" }} />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: "#64748b" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748b";
          }}
          suppressHydrationWarning
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
