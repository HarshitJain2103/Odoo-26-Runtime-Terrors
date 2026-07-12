"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Map,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { NAV_ITEMS, ROLE_LABELS } from "@/lib/constants";
import { canView } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";
import { useState } from "react";

const ICON_MAP = {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  Map,
} as const;

type IconName = keyof typeof ICON_MAP;

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out flex-shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
      style={{ background: "var(--color-sidebar)" }}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b",
          collapsed && "justify-center px-2"
        )}
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #714b67, #00a09d)" }}
        >
          <Truck size={16} color="white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">
              TransitOps
            </p>
            <p className="text-xs leading-tight truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
              Smart Transport
            </p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const IconComponent = ICON_MAP[item.icon as IconName];
          const isActive = pathname.startsWith(item.href);

          // RBAC: hide nav items the user cannot view
          if (role && !canView(role, item.module)) return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "sidebar-link group relative",
                isActive && "active",
                collapsed && "justify-center px-2"
              )}
            >
              <IconComponent
                size={18}
                className="flex-shrink-0"
                strokeWidth={isActive ? 2.5 : 2}
              />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                  style={{ background: "rgba(255,255,255,0.6)" }}
                />
              )}
              {/* Tooltip when collapsed */}
              {collapsed && (
                <span
                  className="absolute left-full ml-3 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                  style={{ background: "#1e293b", color: "#e2e8f0" }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div
        className="border-t p-3"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg p-2",
            collapsed && "justify-center"
          )}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: "var(--color-sidebar-active)" }}
          >
            {getInitials(userName)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium leading-tight truncate">
                {userName}
              </p>
              <p className="text-xs leading-tight truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                {userEmail}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-colors z-10",
        )}
        style={{ background: "#2d2845", border: "1px solid rgba(255,255,255,0.12)" }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={12} color="white" />
        ) : (
          <ChevronLeft size={12} color="white" />
        )}
      </button>
    </aside>
  );
}
