"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { completeTripSchema } from "@/lib/validations";

interface CompleteTripFormProps {
  tripId: string;
  tripCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

type FormErrors = Partial<Record<string, string>>;

export function CompleteTripForm({ tripId, tripCode, onClose, onSuccess }: CompleteTripFormProps) {
  const [form, setForm] = useState({
    actualDistanceKm: "",
    revenue: "",
    completionNotes: "",
    fuelConsumed: "",
    fuelCostPerLiter: "",
    finalOdometer: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-compute total fuel cost
  const fuelTotal =
    Number(form.fuelConsumed) > 0 && Number(form.fuelCostPerLiter) > 0
      ? (Number(form.fuelConsumed) * Number(form.fuelCostPerLiter)).toFixed(2)
      : null;

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setServerError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const parsed = completeTripSchema.safeParse({
      actualDistanceKm: Number(form.actualDistanceKm),
      revenue: Number(form.revenue),
      completionNotes: form.completionNotes || undefined,
      fuelConsumed: form.fuelConsumed ? Number(form.fuelConsumed) : undefined,
      fuelCostPerLiter: form.fuelCostPerLiter ? Number(form.fuelCostPerLiter) : undefined,
      finalOdometer: form.finalOdometer ? Number(form.finalOdometer) : undefined,
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
      const res = await fetch(`/api/trips/${tripId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Could not complete trip");
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
            <h2 className="text-base font-semibold text-gray-900">Complete Trip</h2>
            <p className="text-xs text-gray-400 mt-0.5">{tripCode}</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Actual Distance (km) <span className="text-red-500">*</span></label>
                <input type="number" min="1"
                  className={`form-input ${errors.actualDistanceKm ? "error" : ""}`}
                  placeholder="262"
                  value={form.actualDistanceKm}
                  onChange={(e) => setField("actualDistanceKm", e.target.value)} />
                {errors.actualDistanceKm && <p className="text-xs text-red-500 mt-1">{errors.actualDistanceKm}</p>}
              </div>
              <div>
                <label className="form-label">Revenue (₹)</label>
                <input type="number" min="0"
                  className={`form-input ${errors.revenue ? "error" : ""}`}
                  placeholder="25000"
                  value={form.revenue}
                  onChange={(e) => setField("revenue", e.target.value)} />
              </div>
            </div>

            {/* Fuel section */}
            <div className="rounded-lg p-4 space-y-3" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fuel Log (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Fuel Consumed (L)</label>
                  <input type="number" min="0" step="0.1"
                    className="form-input"
                    placeholder="28.5"
                    value={form.fuelConsumed}
                    onChange={(e) => setField("fuelConsumed", e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Cost per Liter (₹)</label>
                  <input type="number" min="0" step="0.01"
                    className="form-input"
                    placeholder="96.50"
                    value={form.fuelCostPerLiter}
                    onChange={(e) => setField("fuelCostPerLiter", e.target.value)} />
                </div>
              </div>
              {fuelTotal && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Fuel Cost</span>
                  <span className="font-semibold" style={{ color: "#714b67" }}>₹{Number(fuelTotal).toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Final Odometer (km)</label>
              <input type="number" min="0"
                className="form-input"
                placeholder="45362"
                value={form.finalOdometer}
                onChange={(e) => setField("finalOdometer", e.target.value)} />
            </div>

            <div>
              <label className="form-label">Completion Notes</label>
              <textarea className="form-input resize-none" rows={2}
                placeholder="Any notes about the trip…"
                value={form.completionNotes}
                onChange={(e) => setField("completionNotes", e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
              style={{ background: "#16a34a" }}>
              {loading && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {loading ? "Completing…" : "Mark as Completed"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
