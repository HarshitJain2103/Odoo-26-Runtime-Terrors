"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { createVehicleSchema } from "@/lib/validations";
import {
  VEHICLE_TYPE_OPTIONS,
  REGIONS,
} from "@/lib/constants";
import type { Vehicle } from "@prisma/client";

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormErrors = Partial<Record<string, string>>;

const EMPTY_FORM = {
  regNo: "",
  name: "",
  type: "TRUCK",
  capacityKg: "",
  odometer: "",
  acquisitionCost: "",
  region: "Default",
};

export function VehicleForm({ vehicle, onClose, onSuccess }: VehicleFormProps) {
  const isEditing = !!vehicle;
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setForm({
        regNo: vehicle.regNo,
        name: vehicle.name,
        type: vehicle.type,
        capacityKg: String(vehicle.capacityKg),
        odometer: String(vehicle.odometer),
        acquisitionCost: String(vehicle.acquisitionCost),
        region: vehicle.region,
      });
    }
  }, [vehicle]);

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const parsed = createVehicleSchema.safeParse({
      ...form,
      capacityKg: Number(form.capacityKg),
      odometer: Number(form.odometer),
      acquisitionCost: Number(form.acquisitionCost),
    });

    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      parsed.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/vehicles/${vehicle.id}` : "/api/vehicles";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
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
      <div
        className="modal-content w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isEditing ? "Edit Vehicle" : "Add Vehicle"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEditing ? "Update vehicle details" : "Register a new vehicle to the fleet"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Server error */}
            {serverError && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
              >
                <AlertCircle size={15} />
                {serverError}
              </div>
            )}

            {/* Row 1: Reg No + Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Registration No <span className="text-red-500">*</span>
                </label>
                <input
                  className={`form-input uppercase ${errors.regNo ? "error" : ""}`}
                  placeholder="MH-01-AB-1234"
                  value={form.regNo}
                  onChange={(e) => setField("regNo", e.target.value)}
                  disabled={isEditing}
                />
                {errors.regNo && <p className="text-xs text-red-500 mt-1">{errors.regNo}</p>}
                {!isEditing && (
                  <p className="text-xs text-gray-400 mt-1">Must be unique across fleet</p>
                )}
              </div>
              <div>
                <label className="form-label">
                  Vehicle Name / Model <span className="text-red-500">*</span>
                </label>
                <input
                  className={`form-input ${errors.name ? "error" : ""}`}
                  placeholder="Ford Transit Van-01"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
            </div>

            {/* Row 2: Type + Region */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  className={`form-input ${errors.type ? "error" : ""}`}
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value)}
                >
                  {VEHICLE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Region</label>
                <select
                  className="form-input"
                  value={form.region}
                  onChange={(e) => setField("region", e.target.value)}
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Capacity + Odometer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Capacity (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={`form-input ${errors.capacityKg ? "error" : ""}`}
                  placeholder="1000"
                  value={form.capacityKg}
                  onChange={(e) => setField("capacityKg", e.target.value)}
                />
                {errors.capacityKg && <p className="text-xs text-red-500 mt-1">{errors.capacityKg}</p>}
              </div>
              <div>
                <label className="form-label">Odometer (km)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={form.odometer}
                  onChange={(e) => setField("odometer", e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Acquisition Cost */}
            <div>
              <label className="form-label">
                Acquisition Cost (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                className={`form-input ${errors.acquisitionCost ? "error" : ""}`}
                placeholder="1800000"
                value={form.acquisitionCost}
                onChange={(e) => setField("acquisitionCost", e.target.value)}
              />
              {errors.acquisitionCost && (
                <p className="text-xs text-red-500 mt-1">{errors.acquisitionCost}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}
          >
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-sm flex items-center gap-2">
              {loading && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {loading ? "Saving…" : isEditing ? "Save Changes" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
