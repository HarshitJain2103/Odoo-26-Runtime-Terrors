import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard
// Returns all KPI aggregations + chart data + recent trips in one request
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Six months back
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    vehicleCounts,
    driverCounts,
    tripCounts,
    recentTrips,
    monthlyTripData,
  ] = await Promise.all([
    // Vehicle status breakdown
    prisma.vehicle.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // Driver status breakdown
    prisma.driver.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // Trip status breakdown
    prisma.trip.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // Recent 10 trips
    prisma.trip.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: { select: { regNo: true, name: true } },
        driver: { select: { name: true } },
      },
    }),

    // Trips from last 6 months for chart (Prisma-safe, no raw SQL / no BigInt)
    prisma.trip.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, revenue: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Build KPI map from groupBy results
  const vMap: Record<string, number> = {};
  vehicleCounts.forEach((r: { status: string; _count: { status: number } }) => { vMap[r.status] = r._count.status; });

  const dMap: Record<string, number> = {};
  driverCounts.forEach((r: { status: string; _count: { status: number } }) => { dMap[r.status] = r._count.status; });

  const tMap: Record<string, number> = {};
  tripCounts.forEach((r: { status: string; _count: { status: number } }) => { tMap[r.status] = r._count.status; });

  const activeVehicles = vMap["ON_TRIP"] ?? 0;
  const availableVehicles = vMap["AVAILABLE"] ?? 0;
  const inShopVehicles = vMap["IN_SHOP"] ?? 0;
  const retiredVehicles = vMap["RETIRED"] ?? 0;
  const totalNonRetired = activeVehicles + availableVehicles + inShopVehicles;
  const fleetUtilization =
    totalNonRetired > 0 ? Math.round((activeVehicles / totalNonRetired) * 100) : 0;

  // Vehicle status chart
  const vehicleStatusChart = [
    { name: "Available", value: availableVehicles, color: "#16a34a" },
    { name: "On Trip", value: activeVehicles, color: "#3b82f6" },
    { name: "In Shop", value: inShopVehicles, color: "#d97706" },
    { name: "Retired", value: retiredVehicles, color: "#9ca3af" },
  ];

  // Group trips by month in JS — no BigInt, fully serializable
  const monthMap: Record<string, { trips: number; revenue: number }> = {};
  monthlyTripData.forEach((t: { createdAt: Date; revenue: unknown; status: string }) => {
    const label = t.createdAt.toLocaleString("en-US", { month: "short", year: "2-digit" });
    if (!monthMap[label]) monthMap[label] = { trips: 0, revenue: 0 };
    monthMap[label].trips += 1;
    monthMap[label].revenue += Number(t.revenue ?? 0);
  });
  const tripsChart = Object.entries(monthMap).map(([month, data]) => ({
    month,
    trips: data.trips,
    revenue: Math.round(data.revenue),
  }));

  // Serialize recent trips — convert Decimal fields to numbers
  const serializedTrips = recentTrips.map((t: (typeof recentTrips)[number]) => ({
    ...t,
    cargoWeightKg: Number(t.cargoWeightKg),
    plannedDistanceKm: Number(t.plannedDistanceKm),
    actualDistanceKm: t.actualDistanceKm ? Number(t.actualDistanceKm) : null,
    revenue: t.revenue ? Number(t.revenue) : null,
    createdAt: t.createdAt.toISOString(),
    dispatchedAt: t.dispatchedAt?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    cancelledAt: t.cancelledAt?.toISOString() ?? null,
  }));

  return NextResponse.json({
    kpis: {
      activeVehicles,
      availableVehicles,
      inShopVehicles,
      activeTrips: tMap["DISPATCHED"] ?? 0,
      pendingTrips: tMap["DRAFT"] ?? 0,
      driversOnDuty: dMap["ON_TRIP"] ?? 0,
      fleetUtilization,
    },
    vehicleStatusChart,
    tripsChart,
    recentTrips: serializedTrips,
  });
}
