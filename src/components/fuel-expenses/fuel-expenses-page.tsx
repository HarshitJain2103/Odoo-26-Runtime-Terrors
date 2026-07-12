"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Fuel, Receipt, Plus, AlertCircle, X, RefreshCw, TrendingUp,
  Wrench, DollarSign, Calculator,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORY_OPTIONS } from "@/lib/constants";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";

// ─── Types ────────────────────────────────────────────────────
type VehicleOption = { id: string; regNo: string; name: string };
type TripOption = { id: string; code: string };

type FuelLog = {
  id: string;
  date: string;
  liters: number | string;
  costPerLiter: number | string;
  totalCost: number | string;
  odometerAtFill: number | string | null;
  vehicle: { id: string; regNo: string; name: string };
  trip: { id: string; code: string } | null;
};

type Expense = {
  id: string;
  date: string;
  category: string;
  description: string | null;
  amount: number | string;
  vehicle: { id: string; regNo: string; name: string } | null;
  trip: { id: string; code: string } | null;
};

type Summary = {
  totalFuel: number;
  totalFuelThisMonth: number;
  totalMaintenance: number;
  totalExpenses: number;
  totalOperational: number;
};

type BreakdownRow = {
  id: string;
  regNo: string;
  name: string;
  fuel: number;
  maintenance: number;
  other: number;
  total: number;
};

// ─── Fuel Log Form ────────────────────────────────────────────
function FuelLogForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [form, setForm] = useState({
    vehicleId: "",
    tripId: "",
    date: new Date().toISOString().split("T")[0],
    liters: "",
    costPerLiter: "",
    odometerAtFill: "",
  });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const totalCost =
    Number(form.liters) > 0 && Number(form.costPerLiter) > 0
      ? (Number(form.liters) * Number(form.costPerLiter)).toFixed(2)
      : null;

  useEffect(() => {
    Promise.all([fetch("/api/vehicles"), fetch("/api/trips?status=DISPATCHED")]).then(
      async ([vr, tr]) => {
        const vd = await vr.json();
        const td = await tr.json();
        setVehicles(vd.vehicles ?? []);
        setTrips((td.trips ?? []).map((t: { id: string; code: string }) => ({ id: t.id, code: t.code })));
      }
    );
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch("/api/fuel-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: form.vehicleId,
          tripId: form.tripId || undefined,
          date: form.date,
          liters: Number(form.liters),
          costPerLiter: Number(form.costPerLiter),
          odometerAtFill: form.odometerAtFill ? Number(form.odometerAtFill) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? "Error"); return; }
      onSuccess(); onClose();
    } catch { setServerError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="text-base font-semibold text-gray-900">Add Fuel Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="px-6 py-5 space-y-4">
            {serverError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                <AlertCircle size={14} /> {serverError}
              </div>
            )}
            <div>
              <label className="form-label">Vehicle <span className="text-red-500">*</span></label>
              <select required className="form-input" value={form.vehicleId} onChange={(e) => setForm((p) => ({ ...p, vehicleId: e.target.value }))}>
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNo} — {v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Linked Trip (optional)</label>
              <select className="form-input" value={form.tripId} onChange={(e) => setForm((p) => ({ ...p, tripId: e.target.value }))}>
                <option value="">No trip</option>
                {trips.map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Date <span className="text-red-500">*</span></label>
                <input required type="date" className="form-input" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Odometer (km)</label>
                <input type="number" min="0" className="form-input" placeholder="45000" value={form.odometerAtFill} onChange={(e) => setForm((p) => ({ ...p, odometerAtFill: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Liters <span className="text-red-500">*</span></label>
                <input required type="number" min="0.1" step="0.1" className="form-input" placeholder="45.5" value={form.liters} onChange={(e) => setForm((p) => ({ ...p, liters: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Cost/Liter (₹) <span className="text-red-500">*</span></label>
                <input required type="number" min="0.01" step="0.01" className="form-input" placeholder="96.50" value={form.costPerLiter} onChange={(e) => setForm((p) => ({ ...p, costPerLiter: e.target.value }))} />
              </div>
            </div>
            {/* Auto-computed total */}
            {totalCost && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-lg"
                style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
                <span className="text-sm text-gray-500 flex items-center gap-1.5"><Calculator size={14} /> Total Cost</span>
                <span className="text-sm font-bold" style={{ color: "#714b67" }}>₹{Number(totalCost).toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm">{loading ? "Saving…" : "Add Fuel Log"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Expense Form ─────────────────────────────────────────────
function ExpenseForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [form, setForm] = useState({
    vehicleId: "",
    tripId: "",
    category: "TOLL",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles(d.vehicles ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: form.vehicleId || undefined,
          tripId: form.tripId || undefined,
          category: form.category,
          description: form.description || undefined,
          amount: Number(form.amount),
          date: form.date,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? "Error"); return; }
      onSuccess(); onClose();
    } catch { setServerError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="text-base font-semibold text-gray-900">Add Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="px-6 py-5 space-y-4">
            {serverError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                <AlertCircle size={14} /> {serverError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Category <span className="text-red-500">*</span></label>
                <select required className="form-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {EXPENSE_CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Amount (₹) <span className="text-red-500">*</span></label>
                <input required type="number" min="0.01" step="0.01" className="form-input" placeholder="500" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Vehicle (optional)</label>
              <select className="form-input" value={form.vehicleId} onChange={(e) => setForm((p) => ({ ...p, vehicleId: e.target.value }))}>
                <option value="">No vehicle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNo} — {v.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Date <span className="text-red-500">*</span></label>
                <input required type="date" className="form-input" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea rows={2} className="form-input resize-none" placeholder="Notes…" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm">{loading ? "Saving…" : "Add Expense"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Summary Cards ────────────────────────────────────────────
function SummaryCards({ summary }: { summary: Summary | null }) {
  if (!summary) return null;

  const cards = [
    {
      label: "Total Fuel Cost",
      sub: `₹${summary.totalFuelThisMonth.toLocaleString("en-IN")} this month`,
      value: formatCurrency(summary.totalFuel),
      icon: Fuel,
      color: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      label: "Total Maintenance",
      sub: "All time",
      value: formatCurrency(summary.totalMaintenance),
      icon: Wrench,
      color: "#d97706",
      bg: "#fef3c7",
    },
    {
      label: "Other Expenses",
      sub: "Toll, parking, insurance…",
      value: formatCurrency(summary.totalExpenses),
      icon: Receipt,
      color: "#8b5cf6",
      bg: "#f5f3ff",
    },
    {
      label: "Total Operational Cost",
      sub: "Fuel + Maintenance + Other",
      value: formatCurrency(summary.totalOperational),
      icon: TrendingUp,
      color: "#714b67",
      bg: "#f5f0f4",
      accent: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="kpi-card" style={c.accent ? { borderColor: "#d1bbcb" } : {}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">{c.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: c.bg }}>
                <Icon size={16} style={{ color: c.color }} />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-0.5">{c.value}</p>
            <p className="text-xs text-gray-400">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
type Tab = "fuel" | "expenses";

export function FuelExpensesPage() {
  const [tab, setTab] = useState<Tab>("fuel");
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [fuelRes, expRes, sumRes] = await Promise.all([
        fetch("/api/fuel-logs"),
        fetch("/api/expenses"),
        fetch("/api/fuel-expenses/summary"),
      ]);
      const [fuelData, expData, sumData] = await Promise.all([
        fuelRes.json(), expRes.json(), sumRes.json(),
      ]);
      setFuelLogs(fuelData.logs ?? []);
      setExpenses(expData.expenses ?? []);
      setSummary(sumData.summary ?? null);
      setBreakdown(sumData.breakdown ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fuel &amp; Expenses</h2>
          <p className="text-sm text-gray-400 mt-0.5">Operational cost tracking and breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500"
            style={{ border: "1px solid var(--color-border)" }}>
            <RefreshCw size={14} />
          </button>
          {tab === "fuel" ? (
            <button onClick={() => setShowFuelForm(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Add Fuel Log
            </button>
          ) : (
            <button onClick={() => setShowExpenseForm(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)", width: "fit-content" }}>
        {([["fuel", Fuel, "Fuel Logs"], ["expenses", Receipt, "Other Expenses"]] as [Tab, typeof Fuel, string][]).map(([key, Icon, label]) => (
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

      {/* Fuel Logs Tab */}
      {tab === "fuel" && (
        loading ? <TableSkeleton rows={5} /> :
        fuelLogs.length === 0 ? (
          <div className="surface-card">
            <EmptyState icon={Fuel} title="No fuel logs yet"
              description="Add the first fuel log to start tracking"
              action={<button onClick={() => setShowFuelForm(true)} className="btn-primary text-sm">Add Fuel Log</button>} />
          </div>
        ) : (
          <div className="surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Date</th>
                    <th>Liters</th>
                    <th>Cost/Liter</th>
                    <th>Total Cost</th>
                    <th>Odometer</th>
                    <th>Trip</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-gray-700">{log.vehicle.regNo}</span>
                          <span className="text-xs text-gray-400">{log.vehicle.name}</span>
                        </div>
                      </td>
                      <td><span className="text-sm text-gray-600">{formatDate(log.date)}</span></td>
                      <td><span className="text-sm text-gray-700">{Number(log.liters).toFixed(1)} L</span></td>
                      <td><span className="text-sm text-gray-700">₹{Number(log.costPerLiter).toFixed(2)}</span></td>
                      <td><span className="text-sm font-semibold" style={{ color: "#714b67" }}>{formatCurrency(Number(log.totalCost))}</span></td>
                      <td><span className="text-sm text-gray-500">{log.odometerAtFill ? `${Number(log.odometerAtFill).toLocaleString()} km` : "—"}</span></td>
                      <td>
                        {log.trip ? (
                          <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{log.trip.code}</span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Expenses Tab */}
      {tab === "expenses" && (
        loading ? <TableSkeleton rows={5} /> :
        expenses.length === 0 ? (
          <div className="surface-card">
            <EmptyState icon={Receipt} title="No expenses yet"
              description="Add the first expense to start tracking"
              action={<button onClick={() => setShowExpenseForm(true)} className="btn-primary text-sm">Add Expense</button>} />
          </div>
        ) : (
          <div className="surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Vehicle</th>
                    <th>Trip</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td><span className="text-sm text-gray-600">{formatDate(exp.date)}</span></td>
                      <td>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                          {EXPENSE_CATEGORY_OPTIONS.find((o) => o.value === exp.category)?.label ?? exp.category}
                        </span>
                      </td>
                      <td>
                        {exp.vehicle ? (
                          <span className="font-mono text-xs text-gray-600">{exp.vehicle.regNo}</span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td>
                        {exp.trip ? (
                          <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{exp.trip.code}</span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td><span className="text-sm text-gray-500">{exp.description || "—"}</span></td>
                      <td><span className="text-sm font-semibold" style={{ color: "#8b5cf6" }}>{formatCurrency(Number(exp.amount))}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Per-vehicle breakdown */}
      {breakdown.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} style={{ color: "#714b67" }} />
            <h3 className="text-sm font-semibold text-gray-700">Per-Vehicle Cost Breakdown</h3>
          </div>
          <div className="surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Fuel</th>
                    <th>Maintenance</th>
                    <th>Other</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-gray-700">{row.regNo}</span>
                          <span className="text-xs text-gray-400">{row.name}</span>
                        </div>
                      </td>
                      <td><span className="text-sm text-blue-700">{formatCurrency(row.fuel)}</span></td>
                      <td><span className="text-sm text-amber-700">{formatCurrency(row.maintenance)}</span></td>
                      <td><span className="text-sm text-purple-700">{formatCurrency(row.other)}</span></td>
                      <td>
                        <span className="text-sm font-bold" style={{ color: "#714b67" }}>{formatCurrency(row.total)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showFuelForm && <FuelLogForm onClose={() => setShowFuelForm(false)} onSuccess={fetchAll} />}
      {showExpenseForm && <ExpenseForm onClose={() => setShowExpenseForm(false)} onSuccess={fetchAll} />}
    </div>
  );
}
