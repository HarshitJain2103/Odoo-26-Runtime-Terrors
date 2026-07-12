"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Search, Plus, Pencil, AlertTriangle, ChevronUp, ChevronDown,
  ChevronsUpDown, Filter, RefreshCw, UserX,
} from "lucide-react";
import type { Driver } from "@prisma/client";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DriverForm } from "@/components/drivers/driver-form";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate, isLicenseExpired, isLicenseExpiringSoon } from "@/lib/utils";
import { REGIONS } from "@/lib/constants";

type SortField = "name" | "licenseNo" | "licenseCategory" | "licenseExpiry" | "safetyScore" | "status";
type SortOrder = "asc" | "desc";

const DRIVER_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "ON_TRIP", label: "On Trip" },
  { value: "OFF_DUTY", label: "Off Duty" },
  { value: "SUSPENDED", label: "Suspended" },
];

function SafetyBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  return (
    <div className="flex items-center gap-2 min-w-24">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold w-7 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export function DriverTable() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [suspendingDriver, setSuspendingDriver] = useState<Driver | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search, status: statusFilter, region: regionFilter,
        sort: sortField, order: sortOrder,
      });
      const res = await fetch(`/api/drivers?${params}`);
      const data = await res.json();
      setDrivers(data.drivers ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, regionFilter, sortField, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchDrivers, 300);
    return () => clearTimeout(timer);
  }, [fetchDrivers]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-gray-300" />;
    return sortOrder === "asc"
      ? <ChevronUp size={13} style={{ color: "#714b67" }} />
      : <ChevronDown size={13} style={{ color: "#714b67" }} />;
  }

  async function handleStatusToggle(driver: Driver, newStatus: string) {
    await fetch(`/api/drivers/${driver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchDrivers();
  }

  async function handleSuspend() {
    if (!suspendingDriver) return;
    await fetch(`/api/drivers/${suspendingDriver.id}`, { method: "DELETE" });
    fetchDrivers();
  }

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Driver Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${drivers.length} driver${drivers.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={() => { setEditingDriver(null); setShowForm(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />
          Add Driver
        </button>
      </div>

      {/* Business rule notice */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-lg mb-4 text-sm"
        style={{ background: "#fefce8", border: "1px solid #fde047", color: "#854d0e" }}
      >
        <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
        <span>Drivers with expired licenses or <strong>Suspended</strong> status cannot be assigned to trips.</span>
      </div>

      {/* Filters */}
      <div className="surface-card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="form-input pl-9 text-sm h-9"
            placeholder="Search by name or license no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Filter size={15} className="text-gray-400 flex-shrink-0" />
        <select className="form-input text-sm h-9 w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {DRIVER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="form-input text-sm h-9 w-32" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
          <option value="">All Regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          onClick={fetchDrivers}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 flex-shrink-0"
          style={{ border: "1px solid var(--color-border)" }}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : drivers.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={Plus}
            title="No drivers found"
            description={search || statusFilter ? "Try adjusting your filters" : "Add your first driver to get started"}
          />
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {(
                    [
                      { key: "name", label: "Name" },
                      { key: "licenseNo", label: "License No" },
                      { key: "licenseCategory", label: "Category" },
                      { key: "licenseExpiry", label: "Expiry" },
                      { key: "contactNo", label: "Contact" },
                      { key: "safetyScore", label: "Safety Score" },
                      { key: "status", label: "Status" },
                    ] as { key: SortField | "contactNo"; label: string }[]
                  ).map(({ key, label }) => (
                    <th key={key}>
                      <button
                        onClick={() => key !== "contactNo" && handleSort(key as SortField)}
                        className="flex items-center gap-1.5 font-semibold uppercase text-xs tracking-wide hover:text-gray-700 transition-colors"
                      >
                        {label}
                        {key !== "contactNo" && <SortIcon field={key as SortField} />}
                      </button>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => {
                  const expired = isLicenseExpired(d.licenseExpiry);
                  const expiringSoon = isLicenseExpiringSoon(d.licenseExpiry);
                  const rowWarning = expired || expiringSoon;

                  return (
                    <tr
                      key={d.id}
                      style={rowWarning ? { background: "#fefce8" } : undefined}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #714b67, #00a09d)" }}
                          >
                            {d.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800 text-sm">{d.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-gray-600">{d.licenseNo}</span>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-700">{d.licenseCategory}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {rowWarning && (
                            <AlertTriangle
                              size={13}
                              style={{ color: expired ? "#dc2626" : "#d97706" }}
                            />
                          )}
                          <span
                            className="text-sm"
                            style={{ color: expired ? "#dc2626" : expiringSoon ? "#d97706" : "#374151" }}
                          >
                            {formatDate(d.licenseExpiry)}
                          </span>
                        </div>
                        {expired && <p className="text-xs text-red-500">Expired</p>}
                        {!expired && expiringSoon && <p className="text-xs" style={{ color: "#d97706" }}>Expiring soon</p>}
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">{d.contactNo}</span>
                      </td>
                      <td>
                        <SafetyBar score={Number(d.safetyScore)} />
                      </td>
                      <td>
                        <StatusBadge status={d.status} type="driver" />
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => { setEditingDriver(d); setShowForm(true); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          {/* Status toggle: Available ↔ Off Duty */}
                          {d.status === "AVAILABLE" && (
                            <button
                              onClick={() => handleStatusToggle(d, "OFF_DUTY")}
                              className="px-2 py-1 text-xs rounded-lg font-medium transition-colors"
                              style={{ background: "#f1f5f9", color: "#64748b" }}
                              title="Set Off Duty"
                            >
                              Off Duty
                            </button>
                          )}
                          {d.status === "OFF_DUTY" && (
                            <button
                              onClick={() => handleStatusToggle(d, "AVAILABLE")}
                              className="px-2 py-1 text-xs rounded-lg font-medium transition-colors"
                              style={{ background: "#f0fdf4", color: "#16a34a" }}
                              title="Set Available"
                            >
                              Available
                            </button>
                          )}
                          {/* Suspend */}
                          {d.status !== "SUSPENDED" && d.status !== "ON_TRIP" && (
                            <button
                              onClick={() => setSuspendingDriver(d)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Suspend driver"
                            >
                              <UserX size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <DriverForm
          driver={editingDriver}
          onClose={() => { setShowForm(false); setEditingDriver(null); }}
          onSuccess={fetchDrivers}
        />
      )}

      <ConfirmDialog
        isOpen={!!suspendingDriver}
        onClose={() => setSuspendingDriver(null)}
        onConfirm={handleSuspend}
        title="Suspend Driver"
        description={`Suspend "${suspendingDriver?.name}"? They will be marked Suspended and cannot be assigned to trips.`}
        confirmLabel="Suspend Driver"
        variant="danger"
      />
    </div>
  );
}
