import { z } from "zod";

// ── AUTH ──
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ── VEHICLE ──
export const createVehicleSchema = z.object({
  regNo: z.string().min(1, "Registration number is required").max(20).regex(/^[A-Z0-9-]+$/i, "Only letters, numbers, hyphens"),
  name: z.string().min(1, "Vehicle name is required").max(100),
  type: z.enum(["TRUCK", "VAN", "PICKUP", "TRAILER", "BUS", "SEDAN"]),
  capacityKg: z.number({ coerce: true }).positive("Capacity must be positive").max(100000),
  odometer: z.number({ coerce: true }).min(0).default(0),
  acquisitionCost: z.number({ coerce: true }).positive("Acquisition cost must be positive"),
  region: z.string().default("Default"),
});
export const updateVehicleSchema = createVehicleSchema.partial().extend({
  id: z.string().cuid(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"]).optional(),
});
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

// ── DRIVER ──
export const createDriverSchema = z.object({
  name: z.string().min(1, "Driver name is required").max(100),
  licenseNo: z.string().min(1, "License number is required").max(20),
  licenseCategory: z.enum(["A", "B", "C", "D", "E", "CE", "DE"]),
  licenseExpiry: z.string().min(1, "License expiry date is required"),
  contactNo: z.string().min(1, "Contact number is required").max(15),
  safetyScore: z.number({ coerce: true }).min(0).max(100).default(100),
  region: z.string().default("Default"),
});
export const updateDriverSchema = createDriverSchema.partial().extend({
  id: z.string().cuid(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).optional(),
});
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

// ── TRIP ──
export const createTripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  vehicleId: z.string().cuid("Select a vehicle"),
  driverId: z.string().cuid("Select a driver"),
  cargoWeightKg: z.number({ coerce: true }).positive("Cargo weight must be positive"),
  plannedDistanceKm: z.number({ coerce: true }).positive("Distance must be positive"),
  revenue: z.number({ coerce: true }).min(0).optional(),
});
export const completeTripSchema = z.object({
  actualDistanceKm: z.number({ coerce: true }).positive("Actual distance must be positive"),
  revenue: z.number({ coerce: true }).min(0, "Revenue cannot be negative"),
  completionNotes: z.string().optional(),
  fuelConsumed: z.number({ coerce: true }).positive().optional(),
  fuelCostPerLiter: z.number({ coerce: true }).positive().optional(),
  finalOdometer: z.number({ coerce: true }).positive().optional(),
});
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;

// ── MAINTENANCE ──
export const createMaintenanceSchema = z.object({
  vehicleId: z.string().cuid("Select a vehicle"),
  serviceType: z.enum(["OIL_CHANGE", "TIRE_REPLACEMENT", "BRAKE_SERVICE", "ENGINE_REPAIR", "TRANSMISSION", "ELECTRICAL", "BODY_WORK", "GENERAL_INSPECTION", "OTHER"]),
  description: z.string().optional(),
  cost: z.number({ coerce: true }).min(0, "Cost cannot be negative"),
  scheduledDate: z.string().min(1, "Date is required"),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED"]).default("SCHEDULED"),
});
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;

// ── FUEL LOG ──
export const createFuelLogSchema = z.object({
  vehicleId: z.string().cuid("Select a vehicle"),
  tripId: z.string().cuid().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  liters: z.number({ coerce: true }).positive("Liters must be positive"),
  costPerLiter: z.number({ coerce: true }).positive("Cost per liter must be positive"),
  odometerAtFill: z.number({ coerce: true }).min(0).optional(),
});
export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;

// ── EXPENSE ──
export const createExpenseSchema = z.object({
  vehicleId: z.string().cuid().optional().or(z.literal("")),
  tripId: z.string().cuid().optional().or(z.literal("")),
  category: z.enum(["TOLL", "PARKING", "INSURANCE", "FINE", "REPAIR", "OTHER"]),
  description: z.string().optional(),
  amount: z.number({ coerce: true }).positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
