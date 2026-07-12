"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Weight, Loader2 } from "lucide-react";
import { LocationSearch } from "./location-search";
import { createTripSchema } from "@/lib/validations";
import { formatNumber } from "@/lib/utils";

interface AvailableVehicle {
  id: string;
  regNo: string;
  name: string;
  capacityKg: number | string;
  type: string;
}

interface AvailableDriver {
  id: string;
  name: string;
  licenseNo: string;
  licenseCategory: string;
}

interface TripFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

type FormErrors = Partial<Record<string, string>>;

export function TripForm({ onClose, onSuccess }: TripFormProps) {
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [form, setForm] = useState({
    source: "",
    destination: "",
    sourceLat: undefined as number | undefined,
    sourceLng: undefined as number | undefined,
    destLat: undefined as number | undefined,
    destLng: undefined as number | undefined,
    routeGeoJson: null as unknown,
    vehicleId: "",
    driverId: "",
    cargoWeightKg: "",
    plannedDistanceKm: "",
  });
  const [routeLoading, setRouteLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Selected vehicle capacity for live validation
  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const capacity = selectedVehicle ? Number(selectedVehicle.capacityKg) : null;
  const cargoNum = Number(form.cargoWeightKg) || 0;
  const capacityOk = capacity !== null && cargoNum > 0 && cargoNum <= capacity;
  const capacityExceeded = capacity !== null && cargoNum > capacity;

  useEffect(() => {
    async function load() {
      const [vRes, dRes] = await Promise.all([
        fetch("/api/vehicles?status=AVAILABLE"),
        fetch("/api/drivers?status=AVAILABLE&validLicense=true"),
      ]);
      const vData = await vRes.json();
      const dData = await dRes.json();
      setVehicles(vData.vehicles ?? []);
      setDrivers(dData.drivers ?? []);
    }
    load();
  }, []);

  // OSRM auto-routing when both coordinates are set
  useEffect(() => {
    if (form.sourceLat && form.sourceLng && form.destLat && form.destLng) {
      async function getRoute() {
        setRouteLoading(true);
        try {
          // OSRM route request (v1/driving/lon,lat;lon,lat)
          const url = `https://router.project-osrm.org/route/v1/driving/${form.sourceLng},${form.sourceLat};${form.destLng},${form.destLat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.code === "Ok" && data.routes.length > 0) {
            const route = data.routes[0];
            const distanceKm = (route.distance / 1000).toFixed(1);
            setForm(prev => ({
              ...prev,
              plannedDistanceKm: distanceKm,
              routeGeoJson: route.geometry,
            }));
            setErrors(prev => ({ ...prev, plannedDistanceKm: undefined }));
          }
        } catch (err) {
          console.error("OSRM Error:", err);
        } finally {
          setRouteLoading(false);
        }
      }
      getRoute();
    }
  }, [form.sourceLat, form.sourceLng, form.destLat, form.destLng]);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setServerError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    if (capacityExceeded) {
      setErrors((prev) => ({ ...prev, cargoWeightKg: "Cargo exceeds vehicle capacity" }));
      return;
    }

    const parsed = createTripSchema.safeParse({
      ...form,
      cargoWeightKg: Number(form.cargoWeightKg),
      plannedDistanceKm: Number(form.plannedDistanceKm),
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
      const res = await fetch("/api/trips", {
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
      <div className="modal-content w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Create New Trip</h2>
            <p className="text-xs text-gray-400 mt-0.5">Trip will be saved as DRAFT</p>
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

            {/* Source + Destination */}
            <div className="grid grid-cols-2 gap-4">
              <LocationSearch
                label="Source *"
                placeholder="Search starting point..."
                value={form.source}
                error={errors.source}
                onChange={(name, lat, lng) => {
                  setForm(prev => ({ ...prev, source: name, sourceLat: lat, sourceLng: lng }));
                  setErrors(prev => ({ ...prev, source: undefined }));
                }}
              />
              <LocationSearch
                label="Destination *"
                placeholder="Search destination..."
                value={form.destination}
                error={errors.destination}
                onChange={(name, lat, lng) => {
                  setForm(prev => ({ ...prev, destination: name, destLat: lat, destLng: lng }));
                  setErrors(prev => ({ ...prev, destination: undefined }));
                }}
              />
            </div>

            {/* Vehicle dropdown — only AVAILABLE */}
            <div>
              <label className="form-label">Vehicle <span className="text-red-500">*</span></label>
              <select className={`form-input ${errors.vehicleId ? "error" : ""}`}
                value={form.vehicleId} onChange={(e) => setField("vehicleId", e.target.value)}>
                <option value="">Select available vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNo} — {v.name} (Cap: {formatNumber(Number(v.capacityKg))} kg)
                  </option>
                ))}
              </select>
              {errors.vehicleId && <p className="text-xs text-red-500 mt-1">{errors.vehicleId}</p>}
              {vehicles.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No available vehicles at this time</p>
              )}
            </div>

            {/* Driver dropdown — only AVAILABLE + valid license */}
            <div>
              <label className="form-label">Driver <span className="text-red-500">*</span></label>
              <select className={`form-input ${errors.driverId ? "error" : ""}`}
                value={form.driverId} onChange={(e) => setField("driverId", e.target.value)}>
                <option value="">Select available driver…</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.licenseNo} (Cat. {d.licenseCategory})
                  </option>
                ))}
              </select>
              {errors.driverId && <p className="text-xs text-red-500 mt-1">{errors.driverId}</p>}
              {drivers.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No available drivers (check license validity)</p>
              )}
            </div>

            {/* Cargo Weight with LIVE capacity validation */}
            <div>
              <label className="form-label">
                Cargo Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input type="number" min="0.1" step="0.1"
                className={`form-input ${errors.cargoWeightKg || capacityExceeded ? "error" : ""}`}
                placeholder="500"
                value={form.cargoWeightKg}
                onChange={(e) => setField("cargoWeightKg", e.target.value)} />

              {/* Live capacity indicator */}
              {capacity !== null && cargoNum > 0 && (
                <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  capacityOk ? "" : ""
                }`} style={{
                  background: capacityOk ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${capacityOk ? "#bbf7d0" : "#fecaca"}`,
                  color: capacityOk ? "#16a34a" : "#dc2626",
                }}>
                  {capacityOk ? <CheckCircle size={14} /> : <Weight size={14} />}
                  <span>
                    {capacityOk
                      ? `Within capacity — ${formatNumber(cargoNum)} / ${formatNumber(capacity)} kg`
                      : `Exceeds capacity — ${formatNumber(cargoNum)} kg > ${formatNumber(capacity)} kg max`}
                  </span>
                </div>
              )}
              {errors.cargoWeightKg && <p className="text-xs text-red-500 mt-1">{errors.cargoWeightKg}</p>}
            </div>

            {/* Planned Distance */}
            <div>
              <label className="form-label flex items-center gap-2">
                Planned Distance (km) <span className="text-red-500">*</span>
                {routeLoading && <Loader2 size={12} className="animate-spin text-gray-400" />}
              </label>
              <input type="number" min="1" step="0.1"
                className={`form-input ${errors.plannedDistanceKm ? "error" : ""}`}
                placeholder="Auto-calculated if locations found"
                value={form.plannedDistanceKm}
                onChange={(e) => setField("plannedDistanceKm", e.target.value)} />

              {errors.plannedDistanceKm && <p className="text-xs text-red-500 mt-1">{errors.plannedDistanceKm}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading || capacityExceeded}
              className="btn-primary text-sm flex items-center gap-2"
              title={capacityExceeded ? "Cargo weight exceeds vehicle capacity" : undefined}>
              {loading && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {loading ? "Creating…" : "Create Trip (Draft)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
