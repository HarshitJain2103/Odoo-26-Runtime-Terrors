import type {
  VehicleStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
  UserRole,
} from "@prisma/client";

// ─────────────────────────────────────────────
// STATUS COLORS
// ─────────────────────────────────────────────

export const VEHICLE_STATUS_CONFIG: Record<
  VehicleStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  AVAILABLE: { label: "Available", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  ON_TRIP:   { label: "On Trip",   color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       dot: "bg-blue-500" },
  IN_SHOP:   { label: "In Shop",   color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     dot: "bg-amber-500" },
  RETIRED:   { label: "Retired",   color: "text-gray-500",    bg: "bg-gray-50 border-gray-200",       dot: "bg-gray-400" },
};

export const DRIVER_STATUS_CONFIG: Record<
  DriverStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  AVAILABLE: { label: "Available", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  ON_TRIP:   { label: "On Trip",   color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       dot: "bg-blue-500" },
  OFF_DUTY:  { label: "Off Duty",  color: "text-gray-500",    bg: "bg-gray-50 border-gray-200",       dot: "bg-gray-400" },
  SUSPENDED: { label: "Suspended", color: "text-red-700",     bg: "bg-red-50 border-red-200",         dot: "bg-red-500" },
};

export const TRIP_STATUS_CONFIG: Record<
  TripStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  DRAFT:      { label: "Draft",      color: "text-gray-600",    bg: "bg-gray-50 border-gray-200",     dot: "bg-gray-400" },
  DISPATCHED: { label: "Dispatched", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",     dot: "bg-blue-500" },
  COMPLETED:  { label: "Completed",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  CANCELLED:  { label: "Cancelled",  color: "text-red-700",     bg: "bg-red-50 border-red-200",       dot: "bg-red-500" },
};

export const MAINTENANCE_STATUS_CONFIG: Record<
  MaintenanceStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  SCHEDULED:   { label: "Scheduled",   color: "text-gray-600",    bg: "bg-gray-50 border-gray-200",     dot: "bg-gray-400" },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   dot: "bg-amber-500" },
  COMPLETED:   { label: "Completed",   color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
};

// ─────────────────────────────────────────────
// ROLE CONFIGURATION
// ─────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

export type AccessLevel = "NONE" | "VIEW" | "CREATE" | "EDIT" | "FULL";

export const RBAC_MATRIX: Record<UserRole, Record<string, AccessLevel>> = {
  ADMIN:              { dashboard: "FULL", vehicles: "FULL", drivers: "FULL", trips: "FULL", maintenance: "FULL", "fuel-expenses": "FULL", reports: "FULL", settings: "FULL" },
  FLEET_MANAGER:      { dashboard: "VIEW", vehicles: "FULL", drivers: "FULL", trips: "FULL", maintenance: "FULL", "fuel-expenses": "FULL", reports: "VIEW", settings: "VIEW" },
  DISPATCHER:         { dashboard: "VIEW", vehicles: "VIEW", drivers: "VIEW", trips: "FULL", maintenance: "VIEW", "fuel-expenses": "CREATE", reports: "VIEW", settings: "NONE" },
  SAFETY_OFFICER:     { dashboard: "VIEW", vehicles: "VIEW", drivers: "FULL", trips: "VIEW", maintenance: "VIEW", "fuel-expenses": "VIEW", reports: "VIEW", settings: "NONE" },
  FINANCIAL_ANALYST:  { dashboard: "VIEW", vehicles: "VIEW", drivers: "VIEW", trips: "VIEW", maintenance: "VIEW", "fuel-expenses": "FULL", reports: "FULL", settings: "NONE" },
};

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard", module: "dashboard" },
  { href: "/vehicles", label: "Vehicles", icon: "Truck", module: "vehicles" },
  { href: "/drivers", label: "Drivers", icon: "Users", module: "drivers" },
  { href: "/trips", label: "Trips", icon: "Route", module: "trips" },
  { href: "/maintenance", label: "Maintenance", icon: "Wrench", module: "maintenance" },
  { href: "/fuel-expenses", label: "Fuel & Expenses", icon: "Fuel", module: "fuel-expenses" },
  { href: "/reports", label: "Reports", icon: "BarChart3", module: "reports" },
  { href: "/settings", label: "Settings", icon: "Settings", module: "settings" },
] as const;

// ─────────────────────────────────────────────
// DROPDOWN OPTIONS
// ─────────────────────────────────────────────

export const VEHICLE_TYPE_OPTIONS = [
  { value: "TRUCK", label: "Truck" },
  { value: "VAN", label: "Van" },
  { value: "PICKUP", label: "Pickup" },
  { value: "TRAILER", label: "Trailer" },
  { value: "BUS", label: "Bus" },
  { value: "SEDAN", label: "Sedan" },
] as const;

export const LICENSE_CATEGORY_OPTIONS = [
  { value: "A", label: "Category A" },
  { value: "B", label: "Category B" },
  { value: "C", label: "Category C" },
  { value: "D", label: "Category D" },
  { value: "E", label: "Category E" },
  { value: "CE", label: "Category CE" },
  { value: "DE", label: "Category DE" },
] as const;

export const MAINTENANCE_SERVICE_OPTIONS = [
  { value: "OIL_CHANGE", label: "Oil Change" },
  { value: "TIRE_REPLACEMENT", label: "Tire Replacement" },
  { value: "BRAKE_SERVICE", label: "Brake Service" },
  { value: "ENGINE_REPAIR", label: "Engine Repair" },
  { value: "TRANSMISSION", label: "Transmission" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "BODY_WORK", label: "Body Work" },
  { value: "GENERAL_INSPECTION", label: "General Inspection" },
  { value: "OTHER", label: "Other" },
] as const;

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: "TOLL", label: "Toll" },
  { value: "PARKING", label: "Parking" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "FINE", label: "Fine" },
  { value: "REPAIR", label: "Repair" },
  { value: "OTHER", label: "Other" },
] as const;

export const REGIONS = ["North", "South", "East", "West", "Central", "Default"] as const;
