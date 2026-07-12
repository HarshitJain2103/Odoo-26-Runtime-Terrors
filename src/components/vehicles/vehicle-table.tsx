"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown,
  ChevronsUpDown, Filter, RefreshCw,
} from "lucide-react";
import type { Vehicle } from "@prisma/client";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { VEHICLE_TYPE_OPTIONS, REGIONS } from "@/lib/constants";

type SortField = "regNo" | "name" | "type" | "capacityKg" | "odometer" | "acquisitionCost" | "status";
type SortOrder = "asc" | "desc";

const VEHICLE_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "ON_TRIP", label: "On Trip" },
  { value: "IN_SHOP", label: "In Shop" },
  { value: "RETIRED", label: "Retired" },
];

export function VehicleTable() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("regNo");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search, type: typeFilter, status: statusFilter,
        region: regionFilter, sort: sortField, order: sortOrder,
      });
      const res = await fetch(`/api/vehicles?${params}`);
      const data = await res.json();
      setVehicles(data.vehicles ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, regionFilter, sortField, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchVehicles, 300);
    return () => clearTimeout(timer);
  }, [fetchVehicles]);

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
      ? <ChevronUp size={13} className="text-primary-500" style={{ color: "#714b67" }} />
      : <ChevronDown size={13} className="text-primary-500" style={{ color: "#714b67" }} />;
  }

  async function handleDelete() {
    if (!deletingVehicle) return;
    const res = await fetch(`/api/vehicles/${deletingVehicle.id}`, { method: "DELETE" });
    if (res.ok) fetchVehicles();
  }

  function openAdd() {
    setEditingVehicle(null);
    setShowForm(true);
  }

  function openEdit(v: Vehicle) {
    setEditingVehicle(v);
    setShowForm(true);
  }

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vehicle Registry</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${vehicles.length} vehicle${vehicles.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      {/* Filters toolbar */}
      <div className="surface-card p-4 mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="form-input pl-9 text-sm h-9"
            placeholder="Search by reg no or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Filter size={15} className="text-gray-400 flex-shrink-0" />

        {/* Type filter */}
        <select
          className="form-input text-sm h-9 w-36"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {VEHICLE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          className="form-input text-sm h-9 w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {VEHICLE_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Region filter */}
        <select
          className="form-input text-sm h-9 w-32"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
        >
          <option value="">All Regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <button
          onClick={fetchVehicles}
          className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 transition-colors flex-shrink-0"
          style={{ border: "1px solid var(--color-border)" }}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : vehicles.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={Plus}
            title="No vehicles found"
            description={search || typeFilter || statusFilter ? "Try adjusting your filters" : "Add your first vehicle to get started"}
            action={
              !search && !typeFilter && !statusFilter ? (
                <button onClick={openAdd} className="btn-primary text-sm">
                  Add Vehicle
                </button>
              ) : undefined
            }
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
                      { key: "regNo", label: "Reg No" },
                      { key: "name", label: "Name / Model" },
                      { key: "type", label: "Type" },
                      { key: "capacityKg", label: "Capacity (kg)" },
                      { key: "odometer", label: "Odometer (km)" },
                      { key: "acquisitionCost", label: "Acq. Cost" },
                      { key: "status", label: "Status" },
                    ] as { key: SortField; label: string }[]
                  ).map(({ key, label }) => (
                    <th key={key}>
                      <button
                        onClick={() => handleSort(key)}
                        className="flex items-center gap-1.5 font-semibold uppercase text-xs tracking-wide hover:text-gray-700 transition-colors"
                      >
                        {label}
                        <SortIcon field={key} />
                      </button>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {v.regNo}
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-gray-800 text-sm">{v.name}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600 capitalize">{v.type.toLowerCase()}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-700">{formatNumber(Number(v.capacityKg))}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-700">{formatNumber(Number(v.odometer))}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-700">{formatCurrency(Number(v.acquisitionCost))}</span>
                    </td>
                    <td>
                      <StatusBadge status={v.status} type="vehicle" />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(v)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        {v.status !== "RETIRED" && (
                          <button
                            onClick={() => setDeletingVehicle(v)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Retire"
                          >
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

      {/* Add/Edit form modal */}
      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={() => { setShowForm(false); setEditingVehicle(null); }}
          onSuccess={fetchVehicles}
        />
      )}

      {/* Confirm retire dialog */}
      <ConfirmDialog
        isOpen={!!deletingVehicle}
        onClose={() => setDeletingVehicle(null)}
        onConfirm={handleDelete}
        title="Retire Vehicle"
        description={`Retire "${deletingVehicle?.name}" (${deletingVehicle?.regNo})? It will be marked as Retired and hidden from dispatch.`}
        confirmLabel="Retire Vehicle"
        variant="warning"
      />
    </div>
  );
}
