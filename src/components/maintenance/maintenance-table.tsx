"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus, Search, Filter, RefreshCw, Play, CheckCircle, Trash2,
} from "lucide-react";
import type { MaintenanceStatus } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { formatDate, formatCurrency } from "@/lib/utils";
import { MAINTENANCE_SERVICE_OPTIONS } from "@/lib/constants";

type MaintenanceLog = {
  id: string;
  serviceType: string;
  description: string | null;
  cost: number | string;
  scheduledDate: string;
  completedDate: string | null;
  status: MaintenanceStatus;
  vehicle: { id: string; regNo: string; name: string; status: string };
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

// Visual flowchart: SCHEDULED → IN_PROGRESS → COMPLETED
function StatusFlowchart() {
  const steps = [
    { label: "Scheduled", color: "#64748b", bg: "#f8fafc" },
    { label: "In Progress", color: "#d97706", bg: "#fef3c7" },
    { label: "Completed", color: "#16a34a", bg: "#f0fdf4" },
  ];
  return (
    <div className="flex items-center gap-2 mb-6 p-3 rounded-lg" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
      <span className="text-xs text-gray-400 font-medium mr-1">State flow:</span>
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: s.color, background: s.bg }}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="text-gray-300 text-xs">→</span>
          )}
        </div>
      ))}
      <span className="text-xs text-gray-400 ml-2">· IN_PROGRESS sets vehicle to IN_SHOP · COMPLETED restores AVAILABLE</span>
    </div>
  );
}

export function MaintenanceTable() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionError, setActionError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [deletingLog, setDeletingLog] = useState<MaintenanceLog | null>(null);
  const [progressingLog, setProgressingLog] = useState<MaintenanceLog | null>(null);
  const [completingLog, setCompletingLog] = useState<MaintenanceLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      const res = await fetch(`/api/maintenance?${params}`);
      const data = await res.json();
      let result: MaintenanceLog[] = data.logs ?? [];
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (l) =>
            l.vehicle.regNo.toLowerCase().includes(q) ||
            l.vehicle.name.toLowerCase().includes(q) ||
            l.serviceType.toLowerCase().includes(q)
        );
      }
      setLogs(result);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, 300);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  async function patchStatus(log: MaintenanceLog, newStatus: MaintenanceStatus) {
    setActionError("");
    const res = await fetch(`/api/maintenance/${log.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, completedDate: new Date().toISOString().split("T")[0] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setActionError(data.error ?? "Update failed");
      return;
    }
    fetchLogs();
  }

  async function handleDelete() {
    if (!deletingLog) return;
    const res = await fetch(`/api/maintenance/${deletingLog.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setActionError(data.error ?? "Delete failed");
    } else {
      fetchLogs();
    }
  }

  function getServiceLabel(type: string) {
    return MAINTENANCE_SERVICE_OPTIONS.find((o) => o.value === type)?.label ?? type;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Maintenance Log</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${logs.length} record${logs.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />
          Schedule
        </button>
      </div>

      <StatusFlowchart />

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm font-medium"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          {actionError}
          <button onClick={() => setActionError("")} className="ml-auto">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="surface-card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="form-input pl-9 text-sm h-9"
            placeholder="Search by vehicle or service type…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Filter size={15} className="text-gray-400 flex-shrink-0" />
        <select className="form-input text-sm h-9 w-36" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button onClick={fetchLogs}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 flex-shrink-0"
          style={{ border: "1px solid var(--color-border)" }} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : logs.length === 0 ? (
        <div className="surface-card">
          <EmptyState icon={Plus} title="No maintenance records"
            description={search || statusFilter ? "Try adjusting your filters" : "Schedule the first maintenance for a vehicle"}
            action={!search && !statusFilter ? (
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Schedule Maintenance</button>
            ) : undefined} />
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service Type</th>
                  <th>Description</th>
                  <th>Cost</th>
                  <th>Scheduled</th>
                  <th>Completed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-semibold text-gray-700">{log.vehicle.regNo}</span>
                        <span className="text-xs text-gray-400">{log.vehicle.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-700">{getServiceLabel(log.serviceType)}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500 max-w-32 truncate block">
                        {log.description || <span className="text-gray-300">—</span>}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-700">{formatCurrency(Number(log.cost))}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">{formatDate(log.scheduledDate)}</span>
                    </td>
                    <td>
                      {log.completedDate ? (
                        <span className="text-sm text-gray-600">{formatDate(log.completedDate)}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={log.status} type="maintenance" />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {/* SCHEDULED → Start (IN_PROGRESS) */}
                        {log.status === "SCHEDULED" && (
                          <button onClick={() => setProgressingLog(log)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                            style={{ background: "#fef3c7", color: "#d97706" }}
                            title="Start maintenance">
                            <Play size={11} />
                            Start
                          </button>
                        )}
                        {/* IN_PROGRESS → Complete */}
                        {log.status === "IN_PROGRESS" && (
                          <button onClick={() => setCompletingLog(log)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                            style={{ background: "#f0fdf4", color: "#16a34a" }}
                            title="Mark completed">
                            <CheckCircle size={11} />
                            Complete
                          </button>
                        )}
                        {/* Delete — only SCHEDULED */}
                        {log.status === "SCHEDULED" && (
                          <button onClick={() => setDeletingLog(log)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <MaintenanceForm onClose={() => setShowForm(false)} onSuccess={fetchLogs} />
      )}

      <ConfirmDialog
        isOpen={!!progressingLog}
        onClose={() => setProgressingLog(null)}
        onConfirm={() => patchStatus(progressingLog!, "IN_PROGRESS")}
        title="Start Maintenance"
        description={`Start maintenance on "${progressingLog?.vehicle.name}"? Vehicle will be set to IN_SHOP.`}
        confirmLabel="Start"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={!!completingLog}
        onClose={() => setCompletingLog(null)}
        onConfirm={() => patchStatus(completingLog!, "COMPLETED")}
        title="Complete Maintenance"
        description={`Mark maintenance on "${completingLog?.vehicle.name}" as completed? Vehicle will be restored to AVAILABLE.`}
        confirmLabel="Mark Completed"
        variant="default"
      />

      <ConfirmDialog
        isOpen={!!deletingLog}
        onClose={() => setDeletingLog(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        description={`Delete scheduled maintenance for "${deletingLog?.vehicle.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
