"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Shield, Check, Minus, Bell, Mail, AlertTriangle, Clock, RefreshCw, Send } from "lucide-react";
import { RBAC_MATRIX, ROLE_LABELS, type AccessLevel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type UserRole = keyof typeof ROLE_LABELS;

// ─── Types ────────────────────────────────────────────────────
type Tab = "general" | "rbac" | "notifications";

interface DriverAlert {
  name: string;
  licenseNo: string;
  licenseExpiry: string;
  status: string;
  region: string;
  daysRemaining: number;
}

interface NotificationPreview {
  overrideActive: boolean;
  expired: DriverAlert[];
  expiringSoon: DriverAlert[];
  recipients: { name: string; email: string; role: string }[];
}

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
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <Shield size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
        <p className="text-green-700">
          Permissions are driven by the <strong>RBAC_MATRIX</strong> constant — not hardcoded if/else statements.
          All API routes and UI elements check this matrix at runtime via <code className="text-xs bg-green-100 px-1 py-0.5 rounded">hasAccess(role, module, level)</code>.
        </p>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--color-surface-alt)", borderBottom: "1px solid var(--color-border)" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Module</th>
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
          <input type="text" className="form-input" value={appName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppName(e.target.value)} />
          <p className="text-xs text-gray-400 mt-1">Displayed in the browser tab and sidebar logo.</p>
        </div>

        <div>
          <label className="form-label">Default Region</label>
          <select className="form-input" value={defaultRegion}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDefaultRegion(e.target.value)}>
            {["North", "South", "East", "West", "Central"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Pre-selected region in vehicle and driver forms.</p>
        </div>

        <div>
          <label className="form-label">Date Format</label>
          <select className="form-input" value={dateFormat}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDateFormat(e.target.value)}>
            <option value="DD/MM/YYYY">DD/MM/YYYY (India)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-xl"
          style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
          <div>
            <p className="text-sm font-medium text-gray-700">Dark Mode</p>
            <p className="text-xs text-gray-400">Switch to dark theme across the platform</p>
          </div>
          <button type="button" role="switch" aria-checked={darkMode}
            onClick={() => setDarkMode((prev) => !prev)}
            className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
            style={{ background: darkMode ? "#714b67" : "#e2e8f0" }}>
            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              style={{ transform: darkMode ? "translateX(20px)" : "translateX(0)" }} />
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary text-sm">Save Settings</button>
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

// ─── Notifications Tab ────────────────────────────────────────
function NotificationsTab() {
  const [preview, setPreview] = useState<NotificationPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/notifications/license-expiry");
      if (res.ok) setPreview(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  async function handleSendAlert() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/notifications/license-expiry", { method: "POST" });
      const data = await res.json();
      setResult({ success: data.success, message: data.message });
    } finally {
      setSending(false);
    }
  }

  const totalIssues = (preview?.expired.length ?? 0) + (preview?.expiringSoon.length ?? 0);

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Intro card */}
      <div className="surface-card p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#714b67,#2d2845)" }}>
            <Bell size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Driver License Expiry Notifications</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Scans all drivers for expired or soon-to-expire (within 30 days) licenses and sends a
              detailed email alert to all <strong>Admins</strong>, <strong>Fleet Managers</strong>, and{" "}
              <strong>Safety Officers</strong>. Trigger manually below, or automate via cron to{" "}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">POST /api/notifications/license-expiry</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm animate-fade-in"
          style={{
            background: result.success ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${result.success ? "#bbf7d0" : "#fecaca"}`,
            color: result.success ? "#166534" : "#dc2626",
          }}>
          {result.success ? <Check size={16} /> : <AlertTriangle size={16} />}
          {result.message}
        </div>
      )}

      {loading ? (
        <div className="surface-card p-10 text-center">
          <div className="w-7 h-7 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Scanning drivers...</p>
        </div>
      ) : preview ? (
        <>
          {/* Override mode banner */}
          {preview.overrideActive && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
              style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <Mail size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-blue-700">Demo/Dev Mode Active — </span>
                <span className="text-blue-600">
                  All emails will be delivered to <strong>{preview.recipients[0]?.email}</strong> regardless of DB user emails.
                  Remove <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">NOTIFY_OVERRIDE_EMAIL</code> from <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">.env</code> for production.
                </span>
              </div>
            </div>
          )}

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="surface-card p-4 text-center">
              <p className="text-3xl font-bold" style={{ color: "#dc2626" }}>{preview.expired.length}</p>
              <p className="text-xs font-medium text-gray-500 mt-1 flex items-center justify-center gap-1">
                <AlertTriangle size={11} /> Expired
              </p>
            </div>
            <div className="surface-card p-4 text-center">
              <p className="text-3xl font-bold" style={{ color: "#d97706" }}>{preview.expiringSoon.length}</p>
              <p className="text-xs font-medium text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Clock size={11} /> Expiring Soon
              </p>
            </div>
            <div className="surface-card p-4 text-center">
              <p className="text-3xl font-bold text-gray-700">{preview.recipients.length}</p>
              <p className="text-xs font-medium text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Mail size={11} /> Recipients
              </p>
            </div>
          </div>

          {/* Expired drivers table */}
          {preview.expired.length > 0 && (
            <div className="surface-card overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
                <AlertTriangle size={14} style={{ color: "#dc2626" }} />
                <span className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                  {preview.expired.length} Driver{preview.expired.length > 1 ? "s" : ""} — License Expired
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-alt)" }}>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">License No.</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expired</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.expired.map((d, i) => (
                    <tr key={i} style={{ borderBottom: i < preview.expired.length - 1 ? "1px solid var(--color-border)" : undefined }}>
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{d.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{d.licenseNo}</td>
                      <td className="px-4 py-2.5 text-gray-500">{d.region}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ background: "#fee2e2", color: "#dc2626" }}>
                          {Math.abs(d.daysRemaining)}d ago ({formatDate(d.licenseExpiry)})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Expiring soon table */}
          {preview.expiringSoon.length > 0 && (
            <div className="surface-card overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
                <Clock size={14} style={{ color: "#d97706" }} />
                <span className="text-sm font-semibold" style={{ color: "#d97706" }}>
                  {preview.expiringSoon.length} Driver{preview.expiringSoon.length > 1 ? "s" : ""} — Expiring within 30 days
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-alt)" }}>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">License No.</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires In</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.expiringSoon.map((d, i) => (
                    <tr key={i} style={{ borderBottom: i < preview.expiringSoon.length - 1 ? "1px solid var(--color-border)" : undefined }}>
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{d.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{d.licenseNo}</td>
                      <td className="px-4 py-2.5 text-gray-500">{d.region}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ background: "#fef3c7", color: "#d97706" }}>
                          {d.daysRemaining}d ({formatDate(d.licenseExpiry)})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* All clear */}
          {totalIssues === 0 && (
            <div className="surface-card p-10 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "#f0fdf4" }}>
                <Check size={24} className="text-green-600" />
              </div>
              <p className="font-semibold text-gray-700">All licenses are valid!</p>
              <p className="text-sm text-gray-400 mt-1">No drivers have expired or expiring-soon licenses.</p>
            </div>
          )}

          {/* Recipients */}
          {preview.recipients.length > 0 && (
            <div className="surface-card p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Alert Recipients</p>
              <div className="flex flex-wrap gap-2">
                {preview.recipients.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                    style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#714b67,#2d2845)" }}>
                      {r.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-700">{r.name}</span>
                    <span className="text-gray-400 text-xs">{r.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={handleSendAlert} disabled={sending || totalIssues === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity"
              style={{
                background: totalIssues === 0 ? "#9ca3af" : "linear-gradient(135deg,#714b67,#2d2845)",
                cursor: totalIssues === 0 ? "not-allowed" : "pointer",
                opacity: sending ? 0.7 : 1,
              }}>
              {sending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                : <><Send size={15} /> Send Alert Emails</>}
            </button>
            <button onClick={loadPreview} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border hover:bg-gray-50 transition-colors"
              style={{ borderColor: "var(--color-border)" }}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

        </>
      ) : null}
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────
export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">General configuration, access control and notifications</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
        {([
          ["general",       Settings, "General"],
          ["rbac",          Shield,   "RBAC Matrix"],
          ["notifications", Bell,     "Notifications"],
        ] as [Tab, typeof Settings, string][]).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
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

      {tab === "general" ? <GeneralTab /> : tab === "rbac" ? <RbacTab /> : <NotificationsTab />}
    </div>
  );
}
