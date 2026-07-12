"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { createMaintenanceSchema } from "@/lib/validations";
import { MAINTENANCE_SERVICE_OPTIONS } from "@/lib/constants";

interface VehicleOption {
  id: string;
  regNo: string;
  name: string;
  status: string;
}

interface MaintenanceFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

type FormErrors = Partial<Record<string, string>>;

export function MaintenanceForm({ onClose, onSuccess }: MaintenanceFormProps) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [form, setForm] = useState({
    vehicleId: "",
    serviceType: "OIL_CHANGE",
    description: "",
    cost: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    status: "SCHEDULED",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => {
        // Exclude ON_TRIP and RETIRED vehicles
        setVehicles(
          (d.vehicles ?? []).filter(
            (v: VehicleOption) => v.status !== "ON_TRIP" && v.status !== "RETIRED"
          )
        );
      });
  }, []);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setServerError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const parsed = createMaintenanceSchema.safeParse({
      ...form,
      cost: Number(form.cost),
    });

    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      parsed.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Schedule Maintenance</h2>
            <p className="text-xs text-gray-400 mt-0.5">ON_TRIP vehicles are excluded</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {serverError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                <AlertCircle size={15} />
                {serverError}
              </div>
            )}

            {/* Vehicle */}
            <div>
              <label className="form-label">Vehicle <span className="text-red-500">*</span></label>
              <select className={`form-input ${errors.vehicleId ? "error" : ""}`}
                value={form.vehicleId} onChange={(e) => setField("vehicleId", e.target.value)}>
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNo} — {v.name} ({v.status})
                  </option>
                ))}
              </select>
              {errors.vehicleId && <p className="text-xs text-red-500 mt-1">{errors.vehicleId}</p>}
            </div>

            {/* Service Type */}
            <div>
              <label className="form-label">Service Type <span className="text-red-500">*</span></label>
              <select className={`form-input ${errors.serviceType ? "error" : ""}`}
                value={form.serviceType} onChange={(e) => setField("serviceType", e.target.value)}>
                {MAINTENANCE_SERVICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Scheduled Date + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Scheduled Date <span className="text-red-500">*</span></label>
                <input type="date"
                  className={`form-input ${errors.scheduledDate ? "error" : ""}`}
                  value={form.scheduledDate}
                  onChange={(e) => setField("scheduledDate", e.target.value)} />
                {errors.scheduledDate && <p className="text-xs text-red-500 mt-1">{errors.scheduledDate}</p>}
              </div>
              <div>
                <label className="form-label">Initial Status</label>
                <select className="form-input" value={form.status}
                  onChange={(e) => setField("status", e.target.value)}>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                </select>
                {form.status === "IN_PROGRESS" && (
                  <p className="text-xs text-amber-600 mt-1">Vehicle will be set to IN_SHOP</p>
                )}
              </div>
            </div>

            {/* Cost */}
            <div>
              <label className="form-label">Estimated Cost (₹) <span className="text-red-500">*</span></label>
              <input type="number" min="0" step="0.01"
                className={`form-input ${errors.cost ? "error" : ""}`}
                placeholder="5000"
                value={form.cost}
                onChange={(e) => setField("cost", e.target.value)} />
              {errors.cost && <p className="text-xs text-red-500 mt-1">{errors.cost}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="form-label">Description</label>
              <textarea rows={2} className="form-input resize-none"
                placeholder="Additional notes about the service…"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm flex items-center gap-2">
              {loading && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {loading ? "Saving…" : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
