"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Fuel, Activity, DollarSign, TrendingUp, Download, RefreshCw, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { KpiGridSkeleton, TableSkeleton } from "@/components/shared/loading-skeleton";

// ─── Types ────────────────────────────────────────────────────
type Kpis = {
  fuelEfficiency: number;
  fleetUtilization: number;
  totalOperationalCost: number;
  avgRoi: number;
};

type RevCostPoint = { month: string; revenue: number; fuelCost: number };
type EfficiencyPoint = { month: string; kmPerLiter: number };
type CostlyVehicle = { name: string; totalCost: number; type: string };

type VehicleAggRow = {
  id: string;
  regNo: string;
  name: string;
  type: string;
  status: string;
  acquisitionCost: number;
  fuelCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  totalCost: number;
  totalRevenue: number;
  roi: number;
};

// ─── CSV Export ───────────────────────────────────────────────
function exportToCSV(rows: VehicleAggRow[]): void {
  const headers = [
    "Reg No", "Name", "Type", "Status",
    "Acquisition Cost (₹)", "Fuel Cost (₹)", "Maintenance (₹)",
    "Other Expenses (₹)", "Total Cost (₹)", "Revenue (₹)", "ROI (%)",
  ];
  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.regNo, `"${r.name}"`, r.type, r.status,
        r.acquisitionCost, r.fuelCost, r.maintenanceCost,
        r.otherExpenses, r.totalCost, r.totalRevenue, r.roi,
      ].join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transitops_report_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, iconColor, iconBg, accent,
}: {
  label: string; value: string; sub: string;
  icon: typeof Fuel; iconColor: string; iconBg: string; accent?: boolean;
}) {
  return (
    <div className="kpi-card" style={accent ? { borderColor: "#d1bbcb" } : {}}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

// ─── ROI Badge ────────────────────────────────────────────────
function RoiBadge({ roi }: { roi: number }) {
  const color = roi >= 10 ? "#16a34a" : roi >= 0 ? "#d97706" : "#dc2626";
  const bg = roi >= 10 ? "#f0fdf4" : roi >= 0 ? "#fef3c7" : "#fef2f2";
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color, background: bg }}>
      {roi >= 0 ? "+" : ""}{roi}%
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export function ReportsPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [revenueVsCost, setRevenueVsCost] = useState<RevCostPoint[]>([]);
  const [efficiencyTrend, setEfficiencyTrend] = useState<EfficiencyPoint[]>([]);
  const [top5Costly, setTop5Costly] = useState<CostlyVehicle[]>([]);
  const [vehicleAgg, setVehicleAgg] = useState<VehicleAggRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports");
      const data = await res.json() as {
        kpis: Kpis;
        revenueVsCost: RevCostPoint[];
        efficiencyTrend: EfficiencyPoint[];
        top5Costly: CostlyVehicle[];
        vehicleAgg: VehicleAggRow[];
        error?: string;
      };
      if (!res.ok) { setError(data.error ?? "Error loading reports"); return; }
      setKpis(data.kpis);
      setRevenueVsCost(data.revenueVsCost ?? []);
      setEfficiencyTrend(data.efficiencyTrend ?? []);
      setTop5Costly(data.top5Costly ?? []);
      setVehicleAgg(data.vehicleAgg ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const TYPE_COLORS: Record<string, string> = {
    VAN: "#3b82f6", TRUCK: "#d97706", TRAILER: "#8b5cf6",
    PICKUP: "#16a34a", BUS: "#ec4899",
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports &amp; Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Fleet performance, ROI, and operational insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchReports}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500"
            style={{ border: "1px solid var(--color-border)" }}>
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => exportToCSV(vehicleAgg)}
            disabled={vehicleAgg.length === 0}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          {error}
        </div>
      )}

      {/* ROI Formula banner */}
      <div className="rounded-xl px-5 py-3 flex items-center gap-3 text-sm"
        style={{ background: "linear-gradient(135deg, #f5f0f4, #eff6ff)", border: "1px solid #d1bbcb" }}>
        <BarChart3 size={16} style={{ color: "#714b67" }} />
        <span className="font-medium text-gray-600">ROI Formula:</span>
        <code className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: "rgba(113,75,103,0.08)", color: "#714b67" }}>
          ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost × 100
        </code>
      </div>

      {/* 4 KPI Cards */}
      {loading || !kpis ? <KpiGridSkeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Fuel Efficiency"
            value={`${kpis.fuelEfficiency} km/L`}
            sub="Σ Distance / Σ Fuel Liters"
            icon={Fuel} iconColor="#3b82f6" iconBg="#eff6ff"
          />
          <KpiCard
            label="Fleet Utilization"
            value={`${kpis.fleetUtilization}%`}
            sub="Active / (Total − Retired)"
            icon={Activity} iconColor="#714b67" iconBg="#f5f0f4" accent
          />
          <KpiCard
            label="Total Operational Cost"
            value={formatCurrency(kpis.totalOperationalCost)}
            sub="Fuel + Maintenance + Other"
            icon={DollarSign} iconColor="#d97706" iconBg="#fef3c7"
          />
          <KpiCard
            label="Avg Vehicle ROI"
            value={`${kpis.avgRoi >= 0 ? "+" : ""}${kpis.avgRoi}%`}
            sub="(Revenue − Cost) / Acq. Cost"
            icon={TrendingUp} iconColor="#16a34a" iconBg="#f0fdf4"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue vs Fuel Cost — dual bar chart */}
        <div className="surface-card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue vs Fuel Cost</h3>
          {loading ? <div className="h-52 skeleton rounded-lg" /> :
            revenueVsCost.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={revenueVsCost} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    formatter={(val: number, name: string) => [
                      formatCurrency(val),
                      name === "revenue" ? "Revenue" : "Fuel Cost",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="revenue" fill="#714b67" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="fuelCost" name="fuelCost" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Fuel Efficiency Trend — line chart */}
        <div className="surface-card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Fuel Efficiency Trend (km/L)</h3>
          {loading ? <div className="h-52 skeleton rounded-lg" /> :
            efficiencyTrend.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">No completed trips with fuel data</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={efficiencyTrend} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    formatter={(val: number) => [`${val} km/L`, "Efficiency"]}
                  />
                  <Line type="monotone" dataKey="kmPerLiter" stroke="#00a09d" strokeWidth={2}
                    dot={{ r: 4, fill: "#00a09d", strokeWidth: 2, stroke: "white" }}
                    activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* Top 5 costliest vehicles — horizontal bar */}
      <div className="surface-card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 5 Costliest Vehicles</h3>
        {loading ? <div className="h-48 skeleton rounded-lg" /> :
          top5Costly.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No cost data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={top5Costly} margin={{ top: 4, right: 20, bottom: 4, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" width={90}
                  tick={{ fontSize: 11, fill: "#64748b", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(val: number) => [formatCurrency(val), "Total Cost"]}
                />
                <Bar dataKey="totalCost" radius={[0, 4, 4, 0]}>
                  {top5Costly.map((entry, i) => (
                    <Cell key={i} fill={TYPE_COLORS[entry.type] ?? "#714b67"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>

      {/* Per-vehicle ROI table */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h3 className="text-sm font-semibold text-gray-700">Per-Vehicle ROI Breakdown</h3>
          <span className="text-xs text-gray-400">{vehicleAgg.length} vehicles</span>
        </div>
        {loading ? <TableSkeleton rows={5} /> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Fuel Cost</th>
                  <th>Maintenance</th>
                  <th>Other</th>
                  <th>Total Cost</th>
                  <th>Revenue</th>
                  <th>Acq. Cost</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {vehicleAgg
                  .sort((a, b) => b.roi - a.roi)
                  .map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-gray-700">{v.regNo}</span>
                          <span className="text-xs text-gray-400">{v.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: `${TYPE_COLORS[v.type] ?? "#714b67"}15`, color: TYPE_COLORS[v.type] ?? "#714b67" }}>
                          {v.type}
                        </span>
                      </td>
                      <td><span className="text-sm text-blue-600">{formatCurrency(v.fuelCost)}</span></td>
                      <td><span className="text-sm text-amber-600">{formatCurrency(v.maintenanceCost)}</span></td>
                      <td><span className="text-sm text-purple-600">{formatCurrency(v.otherExpenses)}</span></td>
                      <td><span className="text-sm font-semibold text-gray-700">{formatCurrency(v.totalCost)}</span></td>
                      <td><span className="text-sm font-semibold text-green-600">{formatCurrency(v.totalRevenue)}</span></td>
                      <td><span className="text-sm text-gray-500">{formatCurrency(v.acquisitionCost)}</span></td>
                      <td><RoiBadge roi={v.roi} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
