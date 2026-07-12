import { auth } from "@/lib/auth";
import { LayoutDashboard } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as { name?: string | null; role: UserRole };

  return (
    <div className="animate-fade-in">
      {/* Welcome banner */}
      <div
        className="rounded-xl p-6 mb-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #714b67 0%, #2d2845 100%)",
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <LayoutDashboard size={20} color="rgba(255,255,255,0.8)" />
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              {ROLE_LABELS[user.role]}
            </p>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {user.name?.split(" ")[0]} 👋
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)" }} className="text-sm mt-1">
            Dashboard analytics and KPIs are being built — Phase 7 of the plan.
          </p>
        </div>
        {/* Background decoration */}
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: "white" }}
        />
        <div
          className="absolute -right-4 -bottom-12 w-60 h-60 rounded-full opacity-5"
          style={{ background: "white" }}
        />
      </div>

      {/* Phase progress cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Auth & Login", phase: "Phase 1", done: true },
          { label: "Layout & Nav", phase: "Phase 2", done: true },
          { label: "Vehicles & Drivers", phase: "Phase 3", done: false },
          { label: "Trip Dispatcher", phase: "Phase 4", done: false },
        ].map((item) => (
          <div key={item.phase} className="kpi-card flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{
                background: item.done ? "#f0fdf4" : "#f8fafc",
                color: item.done ? "#16a34a" : "#94a3b8",
                border: `1px solid ${item.done ? "#bbf7d0" : "#e2e8f0"}`,
              }}
            >
              {item.done ? "✓" : "○"}
            </div>
            <div>
              <p className="text-xs text-gray-400 leading-tight">{item.phase}</p>
              <p className="text-sm font-medium text-gray-700 leading-tight">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Navigate using the sidebar → Each module will be built phase by phase.
      </p>
    </div>
  );
}
