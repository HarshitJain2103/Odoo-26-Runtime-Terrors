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
} as const;

type IconName = keyof typeof ICON_MAP;

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(true);

  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";

  return (
    <>
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" 
          onClick={() => setCollapsed(true)} 
        />
      )}
      <aside
        className={cn(
          "flex flex-col h-screen fixed top-0 left-0 z-50 transition-all duration-300 ease-in-out flex-shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
        style={{ background: "var(--color-sidebar)" }}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-5 border-b cursor-pointer group",
            collapsed && "justify-center px-2"
          )}
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #714b67, #00a09d)" }}
          >
            <div className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
              <Truck size={16} color="white" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              {collapsed ? <ChevronRight size={16} color="white" strokeWidth={2.5} /> : <ChevronLeft size={16} color="white" strokeWidth={2.5} />}
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0 transition-opacity group-hover:opacity-80">
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
      <nav className="flex-1 px-2 py-4 space-y-0.5">
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
        className={cn("border-t", collapsed ? "p-2" : "p-3")}
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className={cn(
            "flex items-center rounded-lg",
            collapsed ? "justify-center p-1" : "gap-2.5 p-2"
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

    </aside>
    </>
  );
}
