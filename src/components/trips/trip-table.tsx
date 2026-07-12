"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus, Search, Filter, RefreshCw, Send, CheckCircle, XCircle,
} from "lucide-react";
import type { TripStatus } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { TripForm } from "@/components/trips/trip-form";
import { CompleteTripForm } from "@/components/trips/complete-trip-form";
import { TripLifecycleStepper } from "@/components/trips/trip-lifecycle-stepper";
import { formatDate, formatNumber, formatCurrency } from "@/lib/utils";

type TripWithRelations = {
  id: string;
  code: string;
  source: string;
  destination: string;
  status: TripStatus;
  cargoWeightKg: number | string;
  plannedDistanceKm: number | string;
  actualDistanceKm?: number | string | null;
  revenue?: number | string | null;
  dispatchedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  vehicle: { id: string; regNo: string; name: string; capacityKg: number | string };
  driver: { id: string; name: string; licenseNo: string };
};

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function TripTable() {
  const [trips, setTrips] = useState<TripWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionError, setActionError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [completingTrip, setCompletingTrip] = useState<TripWithRelations | null>(null);
  const [cancellingTrip, setCancellingTrip] = useState<TripWithRelations | null>(null);
  const [dispatchingTrip, setDispatchingTrip] = useState<TripWithRelations | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      const res = await fetch(`/api/trips?${params}`);
      const data = await res.json();
      let result: TripWithRelations[] = data.trips ?? [];
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (t) =>
            t.code.toLowerCase().includes(q) ||
            t.source.toLowerCase().includes(q) ||
            t.destination.toLowerCase().includes(q) ||
            t.vehicle.regNo.toLowerCase().includes(q) ||
            t.driver.name.toLowerCase().includes(q)
        );
      }
      setTrips(result);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchTrips, 300);
    return () => clearTimeout(timer);
  }, [fetchTrips]);

  async function handleDispatch() {
    if (!dispatchingTrip) return;
    setActionError("");
    const res = await fetch(`/api/trips/${dispatchingTrip.id}/dispatch`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setActionError(data.error ?? "Dispatch failed");
      return;
    }
    fetchTrips();
  }

  async function handleCancel() {
    if (!cancellingTrip) return;
    setActionError("");
    const res = await fetch(`/api/trips/${cancellingTrip.id}/cancel`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setActionError(data.error ?? "Cancel failed");
    }
    fetchTrips();
  }

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Trip Dispatcher</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${trips.length} trip${trips.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />
          New Trip
        </button>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm font-medium"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          <XCircle size={15} />
          {actionError}
          <button onClick={() => setActionError("")} className="ml-auto text-red-300 hover:text-red-500">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="surface-card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="form-input pl-9 text-sm h-9"
            placeholder="Search by code, route, vehicle, driver…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Filter size={15} className="text-gray-400 flex-shrink-0" />
        <select className="form-input text-sm h-9 w-36" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button onClick={fetchTrips}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 flex-shrink-0"
          style={{ border: "1px solid var(--color-border)" }} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : trips.length === 0 ? (
        <div className="surface-card">
          <EmptyState icon={Plus} title="No trips found"
            description={search || statusFilter ? "Try adjusting your filters" : "Create your first trip to get started"}
            action={!search && !statusFilter ? (
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">New Trip</button>
            ) : undefined} />
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip Code</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Cargo (kg)</th>
                  <th>Lifecycle</th>
                  <th>Status</th>
                  <th>Revenue</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {trip.code}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">{trip.source}</span>
                        <span className="text-xs text-gray-400">→ {trip.destination}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-gray-600">{trip.vehicle.regNo}</span>
                        <span className="text-xs text-gray-400">{trip.vehicle.name}</span>
                      </div>
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
                      <span className="text-sm text-gray-700">{formatNumber(Number(trip.cargoWeightKg))}</span>
                    </td>
                    <td>
                      <TripLifecycleStepper status={trip.status} />
                    </td>
                    <td>
                      <StatusBadge status={trip.status} type="trip" />
                    </td>
                    <td>
                      {trip.revenue ? (
                        <span className="text-sm font-medium" style={{ color: "#16a34a" }}>
                          {formatCurrency(Number(trip.revenue))}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-gray-500">
                        {formatDate(trip.completedAt ?? trip.dispatchedAt ?? trip.createdAt)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {/* DRAFT → Dispatch button */}
                        {trip.status === "DRAFT" && (
                          <button onClick={() => setDispatchingTrip(trip)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                            style={{ background: "#eff6ff", color: "#1d4ed8" }}
                            title="Dispatch trip">
                            <Send size={11} />
                            Dispatch
                          </button>
                        )}
                        {/* DISPATCHED → Complete + Cancel */}
                        {trip.status === "DISPATCHED" && (
                          <>
                            <button onClick={() => setCompletingTrip(trip)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                              style={{ background: "#f0fdf4", color: "#16a34a" }}
                              title="Complete trip">
                              <CheckCircle size={11} />
                              Complete
                            </button>
                            <button onClick={() => setCancellingTrip(trip)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                              style={{ background: "#fef2f2", color: "#dc2626" }}
                              title="Cancel trip">
                              <XCircle size={11} />
                              Cancel
                            </button>
                          </>
                        )}
                        {/* DRAFT → also allow cancel */}
                        {trip.status === "DRAFT" && (
                          <button onClick={() => setCancellingTrip(trip)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                            style={{ background: "#fef2f2", color: "#dc2626" }}
                            title="Cancel draft">
                            <XCircle size={11} />
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
        <TripForm onClose={() => setShowForm(false)} onSuccess={fetchTrips} />
      )}

      {completingTrip && (
        <CompleteTripForm
          tripId={completingTrip.id}
          tripCode={completingTrip.code}
          onClose={() => setCompletingTrip(null)}
          onSuccess={fetchTrips}
        />
      )}

      <ConfirmDialog
        isOpen={!!dispatchingTrip}
        onClose={() => setDispatchingTrip(null)}
        onConfirm={handleDispatch}
        title="Dispatch Trip"
        description={`Dispatch trip ${dispatchingTrip?.code} (${dispatchingTrip?.source} → ${dispatchingTrip?.destination})? Vehicle and driver will be marked ON_TRIP.`}
        confirmLabel="Dispatch"
        variant="default"
      />

      <ConfirmDialog
        isOpen={!!cancellingTrip}
        onClose={() => setCancellingTrip(null)}
        onConfirm={handleCancel}
        title="Cancel Trip"
        description={`Cancel trip ${cancellingTrip?.code}? ${cancellingTrip?.status === "DISPATCHED" ? "Vehicle and driver will be restored to AVAILABLE." : ""}`}
        confirmLabel="Cancel Trip"
        variant="danger"
      />
    </div>
  );
}
