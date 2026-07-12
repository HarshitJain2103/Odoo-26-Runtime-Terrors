import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TransitOps database...");

  // ─── USERS ───────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const managerHash = await bcrypt.hash("Manager@123", 12);
  const dispatcherHash = await bcrypt.hash("Dispatcher@123", 12);

  await prisma.user.upsert({
    where: { email: "admin@transitops.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@transitops.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@transitops.com" },
    update: {},
    create: {
      name: "Fleet Manager",
      email: "manager@transitops.com",
      passwordHash: managerHash,
      role: "FLEET_MANAGER",
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: "dispatcher@transitops.com" },
    update: {},
    create: {
      name: "Trip Dispatcher",
      email: "dispatcher@transitops.com",
      passwordHash: dispatcherHash,
      role: "DISPATCHER",
    },
  });

  console.log("✅ Users seeded");

  // ─── VEHICLES ────────────────────────────────────────────
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { regNo: "MH-01-AB-1234" },
      update: {},
      create: {
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
    prisma.vehicle.upsert({
      where: { regNo: "DL-02-CD-5678" },
      update: {},
      create: {
        regNo: "DL-02-CD-5678",
        name: "Tata Ace Mini Truck-01",
        type: "TRUCK",
        capacityKg: 750,
        odometer: 88000,
        acquisitionCost: 650000,
        status: "AVAILABLE",
        region: "North",
      },
    }),
    prisma.vehicle.upsert({
      where: { regNo: "KA-03-EF-9012" },
      update: {},
      create: {
        regNo: "KA-03-EF-9012",
        name: "Ashok Leyland Truck-01",
        type: "TRUCK",
        capacityKg: 7500,
        odometer: 120000,
        acquisitionCost: 3200000,
        status: "IN_SHOP",
        region: "South",
      },
    }),
    prisma.vehicle.upsert({
      where: { regNo: "GJ-04-GH-3456" },
      update: {},
      create: {
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
    prisma.vehicle.upsert({
      where: { regNo: "TN-05-IJ-7890" },
      update: {},
      create: {
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

  console.log("✅ Vehicles seeded");

  // ─── DRIVERS ─────────────────────────────────────────────
  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { licenseNo: "MH0120190012345" },
      update: {},
      create: {
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
    prisma.driver.upsert({
      where: { licenseNo: "DL0220210056789" },
      update: {},
      create: {
        name: "Suresh Singh",
        licenseNo: "DL0220210056789",
        licenseCategory: "CE",
        licenseExpiry: new Date("2027-03-15"),
        contactNo: "+91-9765432109",
        safetyScore: 87,
        status: "AVAILABLE",
        region: "North",
      },
    }),
    prisma.driver.upsert({
      where: { licenseNo: "KA0320180034567" },
      update: {},
      create: {
        name: "Arun Nair",
        licenseNo: "KA0320180034567",
        licenseCategory: "DE",
        licenseExpiry: new Date("2025-08-20"),
        contactNo: "+91-9654321098",
        safetyScore: 75,
        status: "OFF_DUTY",
        region: "South",
      },
    }),
    prisma.driver.upsert({
      where: { licenseNo: "GJ0420220078901" },
      update: {},
      create: {
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
    prisma.driver.upsert({
      where: { licenseNo: "TN0520170023456" },
      update: {},
      create: {
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

  console.log("✅ Drivers seeded");

  // ─── TRIPS ───────────────────────────────────────────────
  const now = new Date();

  const trip1 = await prisma.trip.upsert({
    where: { code: "TRP-20240601-1001" },
    update: {},
    create: {
      code: "TRP-20240601-1001",
      source: "Mumbai",
      destination: "Pune",
      vehicleId: vehicles[0].id,
      driverId: drivers[0].id,
      createdById: dispatcher.id,
      cargoWeightKg: 850,
      plannedDistanceKm: 155,
      actualDistanceKm: 162,
      revenue: 25000,
      status: "COMPLETED",
      dispatchedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  const trip2 = await prisma.trip.upsert({
    where: { code: "TRP-20240610-1002" },
    update: {},
    create: {
      code: "TRP-20240610-1002",
      source: "Delhi",
      destination: "Jaipur",
      vehicleId: vehicles[1].id,
      driverId: drivers[1].id,
      createdById: dispatcher.id,
      cargoWeightKg: 600,
      plannedDistanceKm: 285,
      status: "DISPATCHED",
      dispatchedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
  });

  await prisma.trip.upsert({
    where: { code: "TRP-20240615-1003" },
    update: {},
    create: {
      code: "TRP-20240615-1003",
      source: "Ahmedabad",
      destination: "Surat",
      vehicleId: vehicles[3].id,
      driverId: drivers[3].id,
      createdById: dispatcher.id,
      cargoWeightKg: 700,
      plannedDistanceKm: 265,
      status: "DRAFT",
    },
  });

  await prisma.trip.upsert({
    where: { code: "TRP-20240502-1004" },
    update: {},
    create: {
      code: "TRP-20240502-1004",
      source: "Chennai",
      destination: "Bangalore",
      vehicleId: vehicles[4].id,
      driverId: drivers[4].id,
      createdById: dispatcher.id,
      cargoWeightKg: 15000,
      plannedDistanceKm: 348,
      actualDistanceKm: 355,
      revenue: 85000,
      status: "COMPLETED",
      dispatchedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Trips seeded");

  // ─── MAINTENANCE ─────────────────────────────────────────
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles[2].id,
      serviceType: "ENGINE_REPAIR",
      description: "Major engine overhaul after 120,000 km service interval",
      cost: 85000,
      status: "IN_PROGRESS",
      scheduledDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles[0].id,
      serviceType: "OIL_CHANGE",
      description: "Routine 5000 km oil change",
      cost: 3500,
      status: "COMPLETED",
      scheduledDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      completedDate: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Maintenance logs seeded");

  // ─── FUEL LOGS ───────────────────────────────────────────
  await prisma.fuelLog.create({
    data: {
      vehicleId: vehicles[0].id,
      tripId: trip1.id,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      liters: 28.5,
      costPerLiter: 96.5,
      totalCost: 2750.25,
      odometerAtFill: 45050,
    },
  });

  await prisma.fuelLog.create({
    data: {
      vehicleId: vehicles[1].id,
      tripId: trip2.id,
      date: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      liters: 42,
      costPerLiter: 94.8,
      totalCost: 3981.6,
      odometerAtFill: 87800,
    },
  });

  console.log("✅ Fuel logs seeded");

  // ─── EXPENSES ────────────────────────────────────────────
  await prisma.expense.create({
    data: {
      vehicleId: vehicles[0].id,
      tripId: trip1.id,
      category: "TOLL",
      description: "Mumbai-Pune expressway toll",
      amount: 285,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.expense.create({
    data: {
      vehicleId: vehicles[0].id,
      category: "INSURANCE",
      description: "Annual comprehensive insurance renewal",
      amount: 42000,
      date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Expenses seeded");

  console.log("\n🎉 Seed complete! You can now log in with:");
  console.log("   admin@transitops.com / Admin@123");
  console.log("   manager@transitops.com / Manager@123");
  console.log("   dispatcher@transitops.com / Dispatcher@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
