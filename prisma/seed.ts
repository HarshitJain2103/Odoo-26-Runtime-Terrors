import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const randomChoice = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Predefined routes for realistic map generation
const PREDEFINED_ROUTES = [
  { source: "Delhi", dest: "Jaipur", sourceLat: 28.6139, sourceLng: 77.2090, destLat: 26.9124, destLng: 75.7873 },
  { source: "Mumbai", dest: "Pune", sourceLat: 19.0760, sourceLng: 72.8777, destLat: 18.5204, destLng: 73.8567 },
  { source: "Bangalore", dest: "Mysore", sourceLat: 12.9716, sourceLng: 77.5946, destLat: 12.2958, destLng: 76.6394 },
  { source: "Ahmedabad", dest: "Surat", sourceLat: 23.0225, sourceLng: 72.5714, destLat: 21.1702, destLng: 72.8311 },
  { source: "Chennai", dest: "Tirupati", sourceLat: 13.0827, sourceLng: 80.2707, destLat: 13.6288, destLng: 79.4192 },
  { source: "Hyderabad", dest: "Warangal", sourceLat: 17.3850, sourceLng: 78.4867, destLat: 17.9689, destLng: 79.5941 },
  { source: "Kolkata", dest: "Durgapur", sourceLat: 22.5726, sourceLng: 88.3639, destLat: 23.5204, destLng: 87.3119 },
];

async function fetchRouteGeoJson(sourceLng: number, sourceLat: number, destLng: number, destLat: number) {
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${sourceLng},${sourceLat};${destLng},${destLat}?overview=full&geometries=geojson`);
    const data = await res.json();
    if (data.code === "Ok" && data.routes.length > 0) {
      return { 
        distance: data.routes[0].distance, 
        geometry: data.routes[0].geometry 
      };
    }
  } catch (err) {
    console.error("Failed to fetch route:", err);
  }
  return null;
}

async function main() {
  console.log("🌱 Seeding TransitOps database (Comprehensive v2)...");

  console.log("🧹 Clearing existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // 1. Users
  const [adminHash, managerHash, dispatcherHash, safetyHash, analystHash] = await Promise.all([
    bcrypt.hash("Admin@123", 12), bcrypt.hash("Manager@123", 12), bcrypt.hash("Dispatcher@123", 12),
    bcrypt.hash("Safety@123", 12), bcrypt.hash("Analyst@123", 12),
  ]);
  const manager = await prisma.user.create({ data: { name: "Fleet Manager", email: "manager@transitops.com", passwordHash: managerHash, role: "FLEET_MANAGER" } });
  const dispatcher = await prisma.user.create({ data: { name: "Trip Dispatcher", email: "dispatcher@transitops.com", passwordHash: dispatcherHash, role: "DISPATCHER" } });
  await prisma.user.create({ data: { name: "System Admin", email: "admin@transitops.com", passwordHash: adminHash, role: "ADMIN" } });
  await prisma.user.create({ data: { name: "Safety Officer", email: "safety@transitops.com", passwordHash: safetyHash, role: "SAFETY_OFFICER" } });
  await prisma.user.create({ data: { name: "Financial Analyst", email: "analyst@transitops.com", passwordHash: analystHash, role: "FINANCIAL_ANALYST" } });

  console.log("✅ Users seeded");

  // 2. Vehicles (20 vehicles)
  const vehicleTypes: ("TRUCK" | "VAN" | "PICKUP" | "TRAILER")[] = ["TRUCK", "VAN", "PICKUP", "TRAILER"];
  const vehicles = [];
  for (let i = 1; i <= 20; i++) {
    const type = randomChoice(vehicleTypes);
    const cap = type === "TRAILER" ? 20000 : type === "TRUCK" ? 10000 : type === "VAN" ? 2000 : 1000;
    vehicles.push(await prisma.vehicle.create({
      data: {
        regNo: `MH-01-${String.fromCharCode(64+randomInt(1,26))}${String.fromCharCode(64+randomInt(1,26))}-${1000+i}`,
        name: `${type.charAt(0) + type.slice(1).toLowerCase()} Model X-${i}`,
        type,
        capacityKg: cap,
        odometer: randomInt(10000, 150000),
        acquisitionCost: randomInt(20000, 80000),
        status: i <= 3 ? "ON_TRIP" : i === 4 ? "IN_SHOP" : i === 20 ? "RETIRED" : "AVAILABLE",
        region: randomChoice(["North", "South", "West", "East", "Central"])
      }
    }));
  }
  console.log("✅ Vehicles seeded (20)");

  // 3. Drivers (20 drivers)
  const drivers = [];
  const firstNames = ["Rajesh", "Suresh", "Ramesh", "Manish", "Amit", "Vikram", "Sunil", "Anil", "Rahul", "Karan"];
  const lastNames = ["Kumar", "Singh", "Patel", "Sharma", "Verma", "Yadav", "Gupta", "Mishra", "Das", "Jain"];
  
  for (let i = 1; i <= 20; i++) {
    drivers.push(await prisma.driver.create({
      data: {
        name: `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
        licenseNo: `DL-${randomInt(10,99)}-${2010+randomInt(1,14)}-${1000000+i}`,
        licenseCategory: randomChoice(["C", "CE", "D"]),
        licenseExpiry: i % 4 === 0 ? daysAgo(randomInt(10, 100)) : daysAgo(-randomInt(100, 1000)), // 25% expired
        contactNo: `98${randomInt(10000000, 99999999)}`,
        safetyScore: randomInt(65, 100),
        status: i <= 3 ? "ON_TRIP" : i === 4 ? "OFF_DUTY" : "AVAILABLE",
        region: randomChoice(["North", "South", "West", "East", "Central"])
      }
    }));
  }
  console.log("✅ Drivers seeded (20)");

  // Pre-fetch route data to avoid fetching 30 times
  console.log("🗺️  Fetching actual routes from OSRM for realism...");
  const cachedRoutes = [];
  for (const r of PREDEFINED_ROUTES) {
    const routeData = await fetchRouteGeoJson(r.sourceLng, r.sourceLat, r.destLng, r.destLat);
    cachedRoutes.push({ ...r, routeData });
    await new Promise(res => setTimeout(res, 500)); // Respect OSRM rate limits
  }

  // 4. Trips (40 trips: 5 DRAFT, 5 DISPATCHED, 30 COMPLETED)
  const trips = [];
  let codeCounter = 1;

  for (let i = 0; i < 40; i++) {
    let status: "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED" = "COMPLETED";
    if (i < 5) status = "DRAFT";
    else if (i < 10) status = "DISPATCHED";

    const v = vehicles[i % vehicles.length];
    const d = drivers[i % drivers.length];
    const r = randomChoice(cachedRoutes);
    const dist = (r.routeData?.distance ?? 100000) / 1000;

    const tripDate = status === "COMPLETED" ? daysAgo(randomInt(10, 180)) : daysAgo(randomInt(0, 5));

    trips.push(await prisma.trip.create({
      data: {
        code: `TRP-00${codeCounter++}`,
        source: r.source,
        destination: r.dest,
        sourceLat: r.sourceLat,
        sourceLng: r.sourceLng,
        destLat: r.destLat,
        destLng: r.destLng,
        routeGeoJson: r.routeData?.geometry ?? undefined,
        vehicleId: v.id,
        driverId: d.id,
        status,
        cargoWeightKg: randomInt(500, Number(v.capacityKg)),
        plannedDistanceKm: dist,
        actualDistanceKm: status === "COMPLETED" ? dist * (1 + (Math.random() * 0.1 - 0.05)) : null,
        revenue: status === "COMPLETED" ? randomInt(5000, 25000) : null,
        createdAt: tripDate,
        dispatchedAt: status !== "DRAFT" ? tripDate : null,
        completedAt: status === "COMPLETED" ? new Date(tripDate.getTime() + 86400000 * randomInt(1, 4)) : null,
        createdById: dispatcher.id
      }
    }));
  }
  console.log("✅ Trips seeded (40) with real GPS routes");

  // Fix vehicle/driver statuses for the first 3 ON_TRIP ones
  for (let i = 5; i < 8; i++) { // These are some of the DISPATCHED trips
    await prisma.vehicle.update({ where: { id: trips[i].vehicleId }, data: { status: "ON_TRIP" } });
    await prisma.driver.update({ where: { id: trips[i].driverId }, data: { status: "ON_TRIP" } });
  }

  // 5. Fuel & Expenses
  for (let i = 0; i < 50; i++) {
    const v = randomChoice(vehicles);
    await prisma.fuelLog.create({
      data: {
        vehicleId: v.id,
        date: daysAgo(randomInt(1, 60)),
        liters: randomInt(30, 150),
        costPerLiter: randomInt(90, 110),
        totalCost: randomInt(3000, 15000),
        odometerAtFill: Number(v.odometer) - randomInt(100, 5000)
      }
    });

    await prisma.expense.create({
      data: {
        vehicleId: v.id,
        category: randomChoice(["TOLL", "PARKING", "REPAIR", "OTHER"]),
        amount: randomInt(200, 2000),
        date: daysAgo(randomInt(1, 60)),
        description: "Routine expense"
      }
    });
  }
  console.log("✅ Fuel & Expenses seeded (100)");

  // 6. Maintenance Logs
  for (let i = 0; i < 20; i++) {
    const v = randomChoice(vehicles);
    const status = i % 5 === 0 ? "IN_PROGRESS" : "COMPLETED";
    await prisma.maintenanceLog.create({
      data: {
        vehicleId: v.id,
        scheduledDate: daysAgo(randomInt(1, 150)),
        completedDate: status === "COMPLETED" ? daysAgo(randomInt(0, 149)) : null,
        serviceType: randomChoice(["OIL_CHANGE", "TIRE_REPLACEMENT", "GENERAL_INSPECTION", "OTHER"]),
        description: randomChoice(["Oil Change", "Brake Pad Replacement", "Annual Inspection", "Tire Rotation"]),
        cost: randomInt(500, 5000),
        status: status
      }
    });
  }
  console.log("✅ Maintenance Logs seeded (20)");

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
