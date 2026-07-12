"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Truck, Users, Route, Wrench, Activity, Clock, BarChart3,
  TrendingUp, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { StatusBadge } from "@/components/shared/status-badge";
import { KpiGridSkeleton, TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { VEHICLE_TYPE_OPTIONS, REGIONS } from "@/lib/constants";

type TripStatus = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";

// ─── Types ────────────────────────────────────────────────────
type Kpis = {
  activeVehicles: number;
  availableVehicles: number;
  inShopVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
};

type ChartPoint = { name: string; value: number; color: string };
type TripPoint = { month: string; trips: number; revenue: number };

type RecentTrip = {
  id: string;
  code: string;
  source: string;
  destination: string;
  status: TripStatus;
  revenue: number | null;
  createdAt: string;
  vehicle: { regNo: string; name: string };
  driver: { name: string };
};

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Truck;
  iconColor: string;
  iconBg: string;
  accent?: boolean;
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
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export function DashboardPage({ userName, userRole }: { userName: string; userRole: string }) {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [vehicleChart, setVehicleChart] = useState<ChartPoint[]>([]);
  const [tripsChart, setTripsChart] = useState<TripPoint[]>([]);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");
  const [tripStatusFilter, setTripStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (vehicleTypeFilter) params.set("vehicleType", vehicleTypeFilter);
      if (tripStatusFilter)  params.set("tripStatus",  tripStatusFilter);
      if (regionFilter)      params.set("region",      regionFilter);
      const res = await fetch(`/api/dashboard?${params}`);
      const data = await res.json();
      setKpis(data.kpis);
      setVehicleChart(data.vehicleStatusChart ?? []);
      setTripsChart(data.tripsChart ?? []);
      setRecentTrips(data.recentTrips ?? []);
    } finally {
      setLoading(false);
    }
  }, [vehicleTypeFilter, tripStatusFilter, regionFilter]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const firstName = userName?.split(" ")[0] ?? "there";

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #714b67 0%, #2d2845 100%)" }}>
        <div className="relative z-10">
          <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>{userRole}</p>
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {firstName} 👋</h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }} className="text-sm">
            {"Here's"} your fleet overview for today.
          </p>
        </div>
        <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full opacity-10" style={{ background: "white" }} />
        <div className="absolute right-8 -bottom-10 w-52 h-52 rounded-full opacity-5" style={{ background: "white" }} />
        <button onClick={fetchDashboard}
          className="absolute top-4 right-4 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Filters row — vehicle type, trip status, region */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-gray-500 mr-1">Filter recent trips:</span>

        <select
          value={vehicleTypeFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVehicleTypeFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border bg-white text-gray-600 focus:outline-none"
          style={{ borderColor: "var(--color-border)" }}>
          <option value="">All Types</option>
          {VEHICLE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={tripStatusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTripStatusFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border bg-white text-gray-600 focus:outline-none"
          style={{ borderColor: "var(--color-border)" }}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={regionFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRegionFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border bg-white text-gray-600 focus:outline-none"
          style={{ borderColor: "var(--color-border)" }}>
          <option value="">All Regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {(vehicleTypeFilter || tripStatusFilter || regionFilter) && (
          <button
            onClick={() => { setVehicleTypeFilter(""); setTripStatusFilter(""); setRegionFilter(""); }}
            className="text-xs px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            style={{ border: "1px solid #fecaca" }}>
            Clear
          </button>
        )}
      </div>

      {/* 7 KPI Cards */}
      {loading || !kpis ? <KpiGridSkeleton /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <KpiCard label="Active Vehicles" value={kpis.activeVehicles} sub="Currently on trip"
            icon={Truck} iconColor="#3b82f6" iconBg="#eff6ff" />
          <KpiCard label="Available Vehicles" value={kpis.availableVehicles} sub="Ready to dispatch"
            icon={Truck} iconColor="#16a34a" iconBg="#f0fdf4" />
          <KpiCard label="In Maintenance" value={kpis.inShopVehicles} sub="In shop"
            icon={Wrench} iconColor="#d97706" iconBg="#fef3c7" />
          <KpiCard label="Fleet Utilization" value={`${kpis.fleetUtilization}%`}
            sub="Active / (Total − Retired)"
            icon={Activity} iconColor="#714b67" iconBg="#f5f0f4" accent />
          <KpiCard label="Active Trips" value={kpis.activeTrips} sub="Dispatched"
            icon={Route} iconColor="#3b82f6" iconBg="#eff6ff" />
          <KpiCard label="Pending Trips" value={kpis.pendingTrips} sub="Draft"
            icon={Clock} iconColor="#9ca3af" iconBg="#f8fafc" />
          <KpiCard label="Drivers On Duty" value={kpis.driversOnDuty} sub="On trip"
            icon={Users} iconColor="#8b5cf6" iconBg="#f5f3ff" />
          {/* 8th card — total utilised capacity, keeps grid even */}
          <KpiCard
            label="Driver Utilization"
            value={`${kpis.driversOnDuty > 0 && kpis.fleetUtilization > 0 ? kpis.fleetUtilization : 0}%`}
            sub="Based on active drivers"
            icon={TrendingUp} iconColor="#00a09d" iconBg="#e6f7f7" />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle status distribution — bar chart */}
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} style={{ color: "#714b67" }} />
            <h3 className="text-sm font-semibold text-gray-700">Vehicle Status Distribution</h3>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="skeleton w-full h-full rounded-lg" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={vehicleChart} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  cursor={{ fill: "rgba(113,75,103,0.04)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {vehicleChart.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Trips by month — area chart */}
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: "#00a09d" }} />
            <h3 className="text-sm font-semibold text-gray-700">Trips &amp; Revenue (Last 6 Months)</h3>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="skeleton w-full h-full rounded-lg" />
            </div>
          ) : tripsChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-gray-400">No trip data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={tripsChart} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <defs>
                  <linearGradient id="tripGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#714b67" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#714b67" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00a09d" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00a09d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(val: number, name: string) =>
                    name === "revenue" ? [formatCurrency(val), "Revenue"] : [val, "Trips"]
                  }
                />
                <Area type="monotone" dataKey="trips" stroke="#714b67" strokeWidth={2}
                  fill="url(#tripGrad)" dot={{ r: 3, fill: "#714b67" }} />
                <Area type="monotone" dataKey="revenue" stroke="#00a09d" strokeWidth={2}
                  fill="url(#revGrad)" dot={{ r: 3, fill: "#00a09d" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent 10 trips */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h3 className="text-sm font-semibold text-gray-700">Recent Trips</h3>
          <a href="/trips" className="text-xs font-medium" style={{ color: "#714b67" }}>View all →</a>
        </div>
        {loading ? (
          <TableSkeleton rows={5} />
        ) : recentTrips.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No trips yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip Code</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Revenue</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip) => (
                  <tr key={trip.id}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {trip.code}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{trip.source}</span>
                        <span className="text-xs text-gray-400">→ {trip.destination}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-gray-600">{trip.vehicle.regNo}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #714b67, #00a09d)" }}>
                          {trip.driver.name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">{trip.driver.name}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={trip.status} type="trip" />
                    </td>
                    <td>
                      {trip.revenue ? (
                        <span className="text-sm font-medium" style={{ color: "#16a34a" }}>
                          {formatCurrency(Number(trip.revenue))}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td>
                      <span className="text-xs text-gray-500">{formatDate(trip.createdAt)}</span>
                    </td>
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
