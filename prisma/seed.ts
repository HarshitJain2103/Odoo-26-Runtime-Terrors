import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";


// Helper: days ago
const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// Helper: months ago
const monthsAgo = (n: number): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

async function main(): Promise<void> {
  console.log("🌱 Seeding TransitOps database (comprehensive)...");

  // ─── CLEAN SLATE (delete in FK-safe order) ────────────────
  console.log("🧹 Clearing existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // ─── USERS ───────────────────────────────────────────────
  const [adminHash, managerHash, dispatcherHash, safetyHash, analystHash] = await Promise.all([
    bcrypt.hash("Admin@123", 12),
    bcrypt.hash("Manager@123", 12),
    bcrypt.hash("Dispatcher@123", 12),
    bcrypt.hash("Safety@123", 12),
    bcrypt.hash("Analyst@123", 12),
  ]);

  const [admin, manager, dispatcher] = await Promise.all([
    prisma.user.create({
      data: {
        name: "System Admin",
        email: "admin@transitops.com",
        passwordHash: adminHash,
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        name: "Fleet Manager",
        email: "manager@transitops.com",
        passwordHash: managerHash,
        role: "FLEET_MANAGER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Trip Dispatcher",
        email: "dispatcher@transitops.com",
        passwordHash: dispatcherHash,
        role: "DISPATCHER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Safety Officer",
        email: "safety@transitops.com",
        passwordHash: safetyHash,
        role: "SAFETY_OFFICER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Financial Analyst",
        email: "analyst@transitops.com",
        passwordHash: analystHash,
        role: "FINANCIAL_ANALYST",
      },
    }),
  ]);

  // Keep admin/manager/dispatcher in scope for audit log etc. later if needed
  void admin;
  void manager;
  void dispatcher;

  console.log("✅ Users seeded (5)");

  // ─── VEHICLES ────────────────────────────────────────────
  // v[1] = ON_TRIP (matched to DISPATCHED trip below)
  // v[2] = IN_SHOP (matched to IN_PROGRESS maintenance below)
  const [v0, v1, v2, v3, v4] = await Promise.all([
    prisma.vehicle.create({
      data: {
        regNo: "MH-01-AB-1234",
        name: "Ford Transit Van-01",
        type: "VAN",
        capacityKg: 1200,
        odometer: 45200,
        acquisitionCost: 1800000,
        status: "AVAILABLE",
        region: "West",
      },
    }),
    prisma.vehicle.create({
      data: {
        regNo: "DL-02-CD-5678",
        name: "Tata Ace Mini Truck-01",
        type: "TRUCK",
        capacityKg: 750,
        odometer: 88000,
        acquisitionCost: 650000,
        status: "ON_TRIP", // matched to DISPATCHED trip
        region: "North",
      },
    }),
    prisma.vehicle.create({
      data: {
        regNo: "KA-03-EF-9012",
        name: "Ashok Leyland Truck-01",
        type: "TRUCK",
        capacityKg: 7500,
        odometer: 120000,
        acquisitionCost: 3200000,
        status: "IN_SHOP", // matched to IN_PROGRESS maintenance
        region: "South",
      },
    }),
    prisma.vehicle.create({
      data: {
        regNo: "GJ-04-GH-3456",
        name: "Mahindra Pickup-01",
        type: "PICKUP",
        capacityKg: 900,
        odometer: 22500,
        acquisitionCost: 980000,
        status: "AVAILABLE",
        region: "West",
      },
    }),
    prisma.vehicle.create({
      data: {
        regNo: "TN-05-IJ-7890",
        name: "Volvo FH Trailer-01",
        type: "TRAILER",
        capacityKg: 20000,
        odometer: 310000,
        acquisitionCost: 8500000,
        status: "AVAILABLE",
        region: "South",
      },
    }),
  ]);

  console.log("✅ Vehicles seeded (5)");

  // ─── DRIVERS ─────────────────────────────────────────────
  // d[1] = ON_TRIP (matched to DISPATCHED trip below)
  const [d0, d1, d2, d3, d4] = await Promise.all([
    prisma.driver.create({
      data: {
        name: "Rajesh Kumar",
        licenseNo: "MH0120190012345",
        licenseCategory: "C",
        licenseExpiry: new Date("2026-11-30"),
        contactNo: "+91-9876543210",
        safetyScore: 92,
        status: "AVAILABLE",
        region: "West",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Suresh Singh",
        licenseNo: "DL0220210056789",
        licenseCategory: "CE",
        licenseExpiry: new Date("2027-03-15"),
        contactNo: "+91-9765432109",
        safetyScore: 87,
        status: "ON_TRIP", // matched to DISPATCHED trip
        region: "North",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Arun Nair",
        licenseNo: "KA0320180034567",
        licenseCategory: "DE",
        licenseExpiry: new Date("2025-08-20"), // EXPIRED — shows red in UI
        contactNo: "+91-9654321098",
        safetyScore: 75,
        status: "OFF_DUTY",
        region: "South",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Manish Patel",
        licenseNo: "GJ0420220078901",
        licenseCategory: "B",
        licenseExpiry: new Date("2028-01-10"),
        contactNo: "+91-9543210987",
        safetyScore: 96,
        status: "AVAILABLE",
        region: "West",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Selvam Raj",
        licenseNo: "TN0520170023456",
        licenseCategory: "CE",
        licenseExpiry: new Date("2026-06-30"),
        contactNo: "+91-9432109876",
        safetyScore: 88,
        status: "AVAILABLE",
        region: "South",
      },
    }),
  ]);

  console.log("✅ Drivers seeded (5)");

  // ─── TRIPS (15 across 5 months for chart data) ───────────
  // Month labels: M-5, M-4, M-3, M-2, M-1, current month

  type TripSeed = {
    code: string;
    source: string;
    destination: string;
    vehicleId: string;
    driverId: string;
    createdById: string;
    cargoWeightKg: number;
    plannedDistanceKm: number;
    actualDistanceKm?: number;
    revenue?: number;
    status: "COMPLETED" | "CANCELLED" | "DISPATCHED" | "DRAFT";
    dispatchedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    createdAt: Date;
  };

  const tripSeeds: TripSeed[] = [
    // ── Month -5 ──
    {
      code: "TRP-001",
      source: "Mumbai",
      destination: "Ahmedabad",
      vehicleId: v0.id, driverId: d0.id, createdById: dispatcher.id,
      cargoWeightKg: 900, plannedDistanceKm: 530,
      actualDistanceKm: 545, revenue: 38000, status: "COMPLETED",
      createdAt: monthsAgo(5),
      dispatchedAt: monthsAgo(5), completedAt: monthsAgo(5),
    },
    {
      code: "TRP-002",
      source: "Chennai",
      destination: "Hyderabad",
      vehicleId: v4.id, driverId: d4.id, createdById: dispatcher.id,
      cargoWeightKg: 12000, plannedDistanceKm: 625,
      actualDistanceKm: 630, revenue: 95000, status: "COMPLETED",
      createdAt: monthsAgo(5),
      dispatchedAt: monthsAgo(5), completedAt: monthsAgo(5),
    },
    // ── Month -4 ──
    {
      code: "TRP-003",
      source: "Delhi",
      destination: "Chandigarh",
      vehicleId: v3.id, driverId: d3.id, createdById: dispatcher.id,
      cargoWeightKg: 750, plannedDistanceKm: 265,
      actualDistanceKm: 270, revenue: 22000, status: "COMPLETED",
      createdAt: monthsAgo(4),
      dispatchedAt: monthsAgo(4), completedAt: monthsAgo(4),
    },
    {
      code: "TRP-004",
      source: "Kolkata",
      destination: "Bhubaneswar",
      vehicleId: v0.id, driverId: d0.id, createdById: dispatcher.id,
      cargoWeightKg: 1100, plannedDistanceKm: 460,
      actualDistanceKm: 472, revenue: 35000, status: "COMPLETED",
      createdAt: monthsAgo(4),
      dispatchedAt: monthsAgo(4), completedAt: monthsAgo(4),
    },
    {
      code: "TRP-005",
      source: "Pune",
      destination: "Nagpur",
      vehicleId: v3.id, driverId: d3.id, createdById: dispatcher.id,
      cargoWeightKg: 800, plannedDistanceKm: 595,
      status: "CANCELLED",
      createdAt: monthsAgo(4),
      dispatchedAt: monthsAgo(4),
      cancelledAt: monthsAgo(4),
    },
    // ── Month -3 ──
    {
      code: "TRP-006",
      source: "Mumbai",
      destination: "Pune",
      vehicleId: v0.id, driverId: d0.id, createdById: dispatcher.id,
      cargoWeightKg: 850, plannedDistanceKm: 155,
      actualDistanceKm: 162, revenue: 25000, status: "COMPLETED",
      createdAt: monthsAgo(3),
      dispatchedAt: monthsAgo(3), completedAt: monthsAgo(3),
    },
    {
      code: "TRP-007",
      source: "Chennai",
      destination: "Bangalore",
      vehicleId: v4.id, driverId: d4.id, createdById: dispatcher.id,
      cargoWeightKg: 15000, plannedDistanceKm: 348,
      actualDistanceKm: 355, revenue: 85000, status: "COMPLETED",
      createdAt: monthsAgo(3),
      dispatchedAt: monthsAgo(3), completedAt: monthsAgo(3),
    },
    {
      code: "TRP-008",
      source: "Hyderabad",
      destination: "Vijayawada",
      vehicleId: v3.id, driverId: d3.id, createdById: dispatcher.id,
      cargoWeightKg: 700, plannedDistanceKm: 275,
      actualDistanceKm: 282, revenue: 21000, status: "COMPLETED",
      createdAt: monthsAgo(3),
      dispatchedAt: monthsAgo(3), completedAt: monthsAgo(3),
    },
    // ── Month -2 ──
    {
      code: "TRP-009",
      source: "Delhi",
      destination: "Lucknow",
      vehicleId: v0.id, driverId: d0.id, createdById: dispatcher.id,
      cargoWeightKg: 1050, plannedDistanceKm: 555,
      actualDistanceKm: 562, revenue: 44000, status: "COMPLETED",
      createdAt: monthsAgo(2),
      dispatchedAt: monthsAgo(2), completedAt: monthsAgo(2),
    },
    {
      code: "TRP-010",
      source: "Bangalore",
      destination: "Mysore",
      vehicleId: v3.id, driverId: d3.id, createdById: dispatcher.id,
      cargoWeightKg: 600, plannedDistanceKm: 145,
      actualDistanceKm: 148, revenue: 12000, status: "COMPLETED",
      createdAt: monthsAgo(2),
      dispatchedAt: monthsAgo(2), completedAt: monthsAgo(2),
    },
    // ── Month -1 ──
    {
      code: "TRP-011",
      source: "Mumbai",
      destination: "Nashik",
      vehicleId: v4.id, driverId: d4.id, createdById: dispatcher.id,
      cargoWeightKg: 18000, plannedDistanceKm: 170,
      actualDistanceKm: 175, revenue: 55000, status: "COMPLETED",
      createdAt: monthsAgo(1),
      dispatchedAt: monthsAgo(1), completedAt: monthsAgo(1),
    },
    {
      code: "TRP-012",
      source: "Ahmedabad",
      destination: "Surat",
      vehicleId: v0.id, driverId: d0.id, createdById: dispatcher.id,
      cargoWeightKg: 800, plannedDistanceKm: 265,
      actualDistanceKm: 270, revenue: 20000, status: "COMPLETED",
      createdAt: monthsAgo(1),
      dispatchedAt: monthsAgo(1), completedAt: monthsAgo(1),
    },
    // ── Current month ──
    {
      code: "TRP-013",
      source: "Pune",
      destination: "Kolhapur",
      vehicleId: v3.id, driverId: d3.id, createdById: dispatcher.id,
      cargoWeightKg: 700, plannedDistanceKm: 228,
      actualDistanceKm: 235, revenue: 18000, status: "COMPLETED",
      createdAt: daysAgo(10),
      dispatchedAt: daysAgo(10), completedAt: daysAgo(9),
    },
    // DISPATCHED — v1 and d1 are ON_TRIP
    {
      code: "TRP-014",
      source: "Delhi",
      destination: "Jaipur",
      vehicleId: v1.id, driverId: d1.id, createdById: dispatcher.id,
      cargoWeightKg: 600, plannedDistanceKm: 285,
      status: "DISPATCHED",
      createdAt: daysAgo(1),
      dispatchedAt: daysAgo(1),
    },
    // DRAFT
    {
      code: "TRP-015",
      source: "Ahmedabad",
      destination: "Rajkot",
      vehicleId: v3.id, driverId: d3.id, createdById: dispatcher.id,
      cargoWeightKg: 750, plannedDistanceKm: 218,
      status: "DRAFT",
      createdAt: daysAgo(0),
    },
  ];

  const createdTrips = await Promise.all(
    tripSeeds.map((seed) =>
      prisma.trip.create({ data: seed })
    )
  );

  const trip0 = createdTrips[0]; // for fuel log linking
  const trip1 = createdTrips[5]; // TRP-006 (completed, Mumbai→Pune)
  const trip13 = createdTrips[13]; // TRP-014 (DISPATCHED)

  console.log(`✅ Trips seeded (${tripSeeds.length})`);

  // ─── MAINTENANCE ─────────────────────────────────────────
  await Promise.all([
    // IN_PROGRESS on v2 (IN_SHOP) — matches vehicle status above
    prisma.maintenanceLog.create({
      data: {
        vehicleId: v2.id,
        serviceType: "ENGINE_REPAIR",
        description: "Major engine overhaul after 120,000 km service interval",
        cost: 85000,
        status: "IN_PROGRESS",
        scheduledDate: daysAgo(2),
      },
    }),
    // COMPLETED on v0
    prisma.maintenanceLog.create({
      data: {
        vehicleId: v0.id,
        serviceType: "OIL_CHANGE",
        description: "Routine 5000 km oil change",
        cost: 3500,
        status: "COMPLETED",
        scheduledDate: daysAgo(20),
        completedDate: daysAgo(19),
      },
    }),
    // COMPLETED on v4
    prisma.maintenanceLog.create({
      data: {
        vehicleId: v4.id,
        serviceType: "TIRE_REPLACEMENT",
        description: "All 6 tyres replaced — 60,000 km wear",
        cost: 62000,
        status: "COMPLETED",
        scheduledDate: monthsAgo(2),
        completedDate: monthsAgo(2),
      },
    }),
    // SCHEDULED on v3
    prisma.maintenanceLog.create({
      data: {
        vehicleId: v3.id,
        serviceType: "BRAKE_SERVICE",
        description: "Scheduled brake pad and fluid replacement",
        cost: 8500,
        status: "SCHEDULED",
        scheduledDate: daysAgo(-3), // 3 days from now
      },
    }),
  ]);

  console.log("✅ Maintenance logs seeded (4)");

  // ─── FUEL LOGS ───────────────────────────────────────────
  await Promise.all([
    prisma.fuelLog.create({
      data: {
        vehicleId: v0.id,
        tripId: trip0.id,
        date: monthsAgo(5),
        liters: 82.5,
        costPerLiter: 94.5,
        totalCost: 82.5 * 94.5,
        odometerAtFill: 44200,
      },
    }),
    prisma.fuelLog.create({
      data: {
        vehicleId: v0.id,
        tripId: trip1.id,
        date: monthsAgo(3),
        liters: 28.5,
        costPerLiter: 96.5,
        totalCost: 28.5 * 96.5,
        odometerAtFill: 45050,
      },
    }),
    prisma.fuelLog.create({
      data: {
        vehicleId: v1.id,
        tripId: trip13.id,
        date: daysAgo(1),
        liters: 42,
        costPerLiter: 94.8,
        totalCost: 42 * 94.8,
        odometerAtFill: 87800,
      },
    }),
    prisma.fuelLog.create({
      data: {
        vehicleId: v4.id,
        date: monthsAgo(1),
        liters: 155,
        costPerLiter: 97.2,
        totalCost: 155 * 97.2,
        odometerAtFill: 309500,
      },
    }),
    prisma.fuelLog.create({
      data: {
        vehicleId: v3.id,
        date: monthsAgo(2),
        liters: 35.5,
        costPerLiter: 95.0,
        totalCost: 35.5 * 95.0,
        odometerAtFill: 22100,
      },
    }),
  ]);

  console.log("✅ Fuel logs seeded (5)");

  // ─── EXPENSES ────────────────────────────────────────────
  await Promise.all([
    prisma.expense.create({
      data: {
        vehicleId: v0.id,
        tripId: trip1.id,
        category: "TOLL",
        description: "Mumbai-Pune expressway toll",
        amount: 285,
        date: monthsAgo(3),
      },
    }),
    prisma.expense.create({
      data: {
        vehicleId: v0.id,
        category: "INSURANCE",
        description: "Annual comprehensive insurance renewal",
        amount: 42000,
        date: monthsAgo(4),
      },
    }),
    prisma.expense.create({
      data: {
        vehicleId: v4.id,
        category: "INSURANCE",
        description: "Annual comprehensive insurance — Volvo trailer",
        amount: 68000,
        date: monthsAgo(4),
      },
    }),
    prisma.expense.create({
      data: {
        vehicleId: v1.id,
        tripId: trip13.id,
        category: "TOLL",
        description: "Delhi-Jaipur NH-48 toll",
        amount: 420,
        date: daysAgo(1),
      },
    }),
    prisma.expense.create({
      data: {
        vehicleId: v3.id,
        category: "PARKING",
        description: "Overnight parking — Surat depot",
        amount: 800,
        date: monthsAgo(1),
      },
    }),
    prisma.expense.create({
      data: {
        vehicleId: v2.id,
        category: "REPAIR",
        description: "Emergency roadside tyre puncture repair",
        amount: 2200,
        date: monthsAgo(3),
      },
    }),
  ]);

  console.log("✅ Expenses seeded (6)");

  console.log("\n🎉 Seed complete! Login credentials:");
  console.log("   Fleet Manager: manager@transitops.com / Manager@123");
  console.log("   Dispatcher:    dispatcher@transitops.com / Dispatcher@123");
  console.log("   Admin:         admin@transitops.com / Admin@123");
  console.log("\n📊 Dashboard summary:");
  console.log("   • 5 vehicles (1 ON_TRIP, 1 IN_SHOP, 3 AVAILABLE)");
  console.log("   • 5 drivers (1 ON_TRIP, 1 OFF_DUTY, 1 expired license, 2 AVAILABLE)");
  console.log(`   • ${tripSeeds.length} trips across 5 months (for chart data)`);
  console.log("   • 4 maintenance logs, 5 fuel logs, 6 expenses");
}

main()
  .catch((e: unknown) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
