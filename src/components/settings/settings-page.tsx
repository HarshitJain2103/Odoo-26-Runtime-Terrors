"use client";

import { useState } from "react";
import { Settings, Shield, Check, Minus } from "lucide-react";
import { RBAC_MATRIX, ROLE_LABELS, type AccessLevel } from "@/lib/constants";

type UserRole = keyof typeof ROLE_LABELS;

// ─── Types ────────────────────────────────────────────────────
type Tab = "general" | "rbac";

// ─── Access level badge ───────────────────────────────────────
function AccessBadge({ level }: { level: AccessLevel }) {
  if (level === "NONE") {
    return (
      <span className="flex items-center justify-center">
        <Minus size={14} className="text-gray-300" />
      </span>
    );
  }

  const config: Record<Exclude<AccessLevel, "NONE">, { label: string; color: string; bg: string }> = {
    VIEW:   { label: "View",   color: "#64748b", bg: "#f8fafc" },
    CREATE: { label: "Create", color: "#d97706", bg: "#fef3c7" },
    EDIT:   { label: "Edit",   color: "#3b82f6", bg: "#eff6ff" },
    FULL:   { label: "Full",   color: "#16a34a", bg: "#f0fdf4" },
  };

  const c = config[level];

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: c.color, background: c.bg }}>
      <Check size={10} strokeWidth={3} />
      {c.label}
    </span>
  );
}

// ─── RBAC Matrix ─────────────────────────────────────────────
const MODULES: { key: string; label: string }[] = [
  { key: "dashboard",    label: "Dashboard" },
  { key: "vehicles",     label: "Vehicles" },
  { key: "drivers",      label: "Drivers" },
  { key: "trips",        label: "Trips" },
  { key: "maintenance",  label: "Maintenance" },
  { key: "fuel-expenses", label: "Fuel & Expenses" },
  { key: "reports",      label: "Reports" },
  { key: "settings",     label: "Settings" },
];

const ROLES: UserRole[] = ["ADMIN", "FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"];

function RbacTab() {
  return (
    <div className="space-y-4">
      {/* Explanation */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <Shield size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
        <p className="text-green-700">
          Permissions are driven by the <strong>RBAC_MATRIX</strong> constant — not hardcoded if/else statements.
          All API routes and UI elements check this matrix at runtime via <code className="text-xs bg-green-100 px-1 py-0.5 rounded">hasAccess(role, module, level)</code>.
        </p>
      </div>

      {/* Matrix table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--color-surface-alt)", borderBottom: "1px solid var(--color-border)" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">
                  Module
                </th>
                {ROLES.map((role) => (
                  <th key={role} className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod, i) => (
                <tr key={mod.key}
                  style={{ borderBottom: i < MODULES.length - 1 ? "1px solid var(--color-border)" : undefined }}>
                  <td className="px-4 py-3 font-medium text-gray-700 text-sm">{mod.label}</td>
                  {ROLES.map((role) => {
                    const level = (RBAC_MATRIX[role]?.[mod.key] ?? "NONE") as AccessLevel;
                    return (
                      <td key={role} className="px-3 py-3 text-center">
                        <AccessBadge level={level} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="font-medium">Legend:</span>
        {(["VIEW", "CREATE", "EDIT", "FULL", "NONE"] as AccessLevel[]).map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <AccessBadge level={level} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── General Tab ─────────────────────────────────────────────
function GeneralTab() {
  const [appName, setAppName] = useState("TransitOps");
  const [defaultRegion, setDefaultRegion] = useState("West");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSave}>
      <div className="surface-card p-6 space-y-5 max-w-xl">
        <div>
          <label className="form-label">Application Name</label>
          <input
            type="text"
            className="form-input"
            value={appName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppName(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">Displayed in the browser tab and sidebar logo.</p>
        </div>

        <div>
          <label className="form-label">Default Region</label>
          <select
            className="form-input"
            value={defaultRegion}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDefaultRegion(e.target.value)}>
            {["North", "South", "East", "West", "Central"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Pre-selected region in vehicle and driver forms.</p>
        </div>

        <div>
          <label className="form-label">Date Format</label>
          <select
            className="form-input"
            value={dateFormat}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDateFormat(e.target.value)}>
            <option value="DD/MM/YYYY">DD/MM/YYYY (India)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          </select>
        </div>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between py-3 px-4 rounded-xl"
          style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
          <div>
            <p className="text-sm font-medium text-gray-700">Dark Mode</p>
            <p className="text-xs text-gray-400">Switch to dark theme across the platform</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            onClick={() => setDarkMode((prev) => !prev)}
            className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
            style={{ background: darkMode ? "#714b67" : "#e2e8f0" }}>
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              style={{ transform: darkMode ? "translateX(20px)" : "translateX(0)" }}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary text-sm">
            Save Settings
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 animate-fade-in">
              <Check size={14} strokeWidth={3} /> Saved
            </span>
          )}
        </div>
      </div>
    </form>
  );
}

// ─── Main Settings Page ───────────────────────────────────────
export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">General configuration and access control</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
        {([
          ["general", Settings, "General"],
          ["rbac",    Shield,   "RBAC Matrix"],
        ] as [Tab, typeof Settings, string][]).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === key ? "white" : "transparent",
              color: tab === key ? "#714b67" : "#64748b",
              boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "general" ? <GeneralTab /> : <RbacTab />}
    </div>
  );
}
