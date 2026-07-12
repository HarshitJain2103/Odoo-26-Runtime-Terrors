"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { createDriverSchema } from "@/lib/validations";
import { LICENSE_CATEGORY_OPTIONS, REGIONS } from "@/lib/constants";
import type { Driver } from "@prisma/client";

interface DriverFormProps {
  driver?: Driver | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormErrors = Partial<Record<string, string>>;

const EMPTY_FORM = {
  name: "",
  licenseNo: "",
  licenseCategory: "B",
  licenseExpiry: "",
  contactNo: "",
  safetyScore: "100",
  region: "Default",
};

export function DriverForm({ driver, onClose, onSuccess }: DriverFormProps) {
  const isEditing = !!driver;
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driver) {
      setForm({
        name: driver.name,
        licenseNo: driver.licenseNo,
        licenseCategory: driver.licenseCategory,
        licenseExpiry: new Date(driver.licenseExpiry).toISOString().split("T")[0],
        contactNo: driver.contactNo,
        safetyScore: String(driver.safetyScore),
        region: driver.region,
      });
    }
  }, [driver]);

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const parsed = createDriverSchema.safeParse({
      ...form,
      safetyScore: Number(form.safetyScore),
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
      const url = isEditing ? `/api/drivers/${driver.id}` : "/api/drivers";
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

  const safetyNum = Number(form.safetyScore) || 0;
  const safetyColor =
    safetyNum >= 80 ? "#16a34a" : safetyNum >= 50 ? "#d97706" : "#dc2626";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isEditing ? "Edit Driver" : "Add Driver"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEditing ? "Update driver details" : "Register a new driver"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {serverError && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
              >
                <AlertCircle size={15} />
                {serverError}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="form-label">Full Name <span className="text-red-500">*</span></label>
              <input
                className={`form-input ${errors.name ? "error" : ""}`}
                placeholder="Rajesh Kumar"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* License No + Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">License No <span className="text-red-500">*</span></label>
                <input
                  className={`form-input ${errors.licenseNo ? "error" : ""}`}
                  placeholder="MH0120190012345"
                  value={form.licenseNo}
                  onChange={(e) => setField("licenseNo", e.target.value)}
                  disabled={isEditing}
                />
                {errors.licenseNo && <p className="text-xs text-red-500 mt-1">{errors.licenseNo}</p>}
              </div>
              <div>
                <label className="form-label">License Category <span className="text-red-500">*</span></label>
                <select
                  className="form-input"
                  value={form.licenseCategory}
                  onChange={(e) => setField("licenseCategory", e.target.value)}
                >
                  {LICENSE_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expiry + Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">License Expiry <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className={`form-input ${errors.licenseExpiry ? "error" : ""}`}
                  value={form.licenseExpiry}
                  onChange={(e) => setField("licenseExpiry", e.target.value)}
                />
                {errors.licenseExpiry && <p className="text-xs text-red-500 mt-1">{errors.licenseExpiry}</p>}
              </div>
              <div>
                <label className="form-label">Contact No <span className="text-red-500">*</span></label>
                <input
                  className={`form-input ${errors.contactNo ? "error" : ""}`}
                  placeholder="+91-9876543210"
                  value={form.contactNo}
                  onChange={(e) => setField("contactNo", e.target.value)}
                />
                {errors.contactNo && <p className="text-xs text-red-500 mt-1">{errors.contactNo}</p>}
              </div>
            </div>

            {/* Safety Score */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label mb-0">Safety Score</label>
                <span className="text-sm font-semibold" style={{ color: safetyColor }}>
                  {form.safetyScore} / 100
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={form.safetyScore}
                onChange={(e) => setField("safetyScore", e.target.value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: safetyColor }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 — Poor</span>
                <span>50 — Fair</span>
                <span>100 — Excellent</span>
              </div>
            </div>

            {/* Region */}
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

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}
          >
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm flex items-center gap-2">
              {loading && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {loading ? "Saving…" : isEditing ? "Save Changes" : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
