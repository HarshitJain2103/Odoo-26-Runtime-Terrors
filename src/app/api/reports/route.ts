import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Explicit type for per-vehicle aggregation result
type VehicleAggRow = {
  id: string;
  regNo: string;
  name: string;
  type: string;
  status: string;
  acquisitionCost: number;
  fuelCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  totalCost: number;
  totalRevenue: number;
  roi: number; // (revenue - cost) / acquisitionCost  * 100
};

// GET /api/reports
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      vehicleRows,
      fuelAgg,
      maintenanceAgg,
      expenseAgg,
      vehicleCounts,
      completedTrips,
      monthlyData,
      monthlyFuel,
    ] = await Promise.all([
      // Full per-vehicle data for ROI table + top-5 cost chart
      prisma.vehicle.findMany({
        select: {
          id: true,
          regNo: true,
          name: true,
          type: true,
          status: true,
          acquisitionCost: true,
          fuelLogs: { select: { totalCost: true, liters: true } },
          maintenanceLogs: { select: { cost: true } },
          expenses: { select: { amount: true } },
          trips: {
            where: { status: "COMPLETED" },
            select: { revenue: true, actualDistanceKm: true },
          },
        },
      }),

      // Total fuel cost + liters (for fuel efficiency KPI)
      prisma.fuelLog.aggregate({ _sum: { totalCost: true, liters: true } }),

      // Total maintenance cost
      prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),

      // Total other expenses
      prisma.expense.aggregate({ _sum: { amount: true } }),

      // Vehicle counts for fleet utilization KPI
      prisma.vehicle.groupBy({ by: ["status"], _count: { status: true } }),

      // Completed trips with distance + fuel for efficiency trend
      prisma.trip.findMany({
        where: { status: "COMPLETED", actualDistanceKm: { not: null } },
        select: {
          createdAt: true,
          actualDistanceKm: true,
          revenue: true,
          fuelLogs: { select: { liters: true } },
        },
        orderBy: { createdAt: "asc" },
      }),

      // Monthly revenue from completed trips (last 6 months)
      prisma.trip.findMany({
        where: { status: "COMPLETED", createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, revenue: true },
        orderBy: { createdAt: "asc" },
      }),

      // Monthly fuel cost (last 6 months)
      prisma.fuelLog.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { date: true, totalCost: true },
        orderBy: { date: "asc" },
      }),
    ]);

    // ── KPI: Fleet Utilization ────────────────────────────
    const vMap: Record<string, number> = {};
    vehicleCounts.forEach((r: { status: string; _count: { status: number } }) => {
      vMap[r.status] = r._count.status;
    });
    const activeVehicles = vMap["ON_TRIP"] ?? 0;
    const totalNonRetired =
      (vMap["ON_TRIP"] ?? 0) + (vMap["AVAILABLE"] ?? 0) + (vMap["IN_SHOP"] ?? 0);
    const fleetUtilization =
      totalNonRetired > 0 ? Math.round((activeVehicles / totalNonRetired) * 100) : 0;

    // ── KPI: Fuel Efficiency (km/L) ──────────────────────
    const totalLiters = Number(fuelAgg._sum.liters ?? 0);
    const completedDistanceKm = completedTrips.reduce(
      (sum: number, t: { actualDistanceKm: unknown }) => sum + Number(t.actualDistanceKm ?? 0),
      0
    );
    const fuelEfficiency =
      totalLiters > 0 ? Math.round((completedDistanceKm / totalLiters) * 10) / 10 : 0;

    // ── KPI: Total Operational Cost ───────────────────────
    const totalFuelCost = Number(fuelAgg._sum.totalCost ?? 0);
    const totalMaintenanceCost = Number(maintenanceAgg._sum.cost ?? 0);
    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenses;

    // ── Per-vehicle aggregation ───────────────────────────
    const vehicleAgg: VehicleAggRow[] = vehicleRows.map((v: {
      id: string;
      regNo: string;
      name: string;
      type: string;
      status: string;
      acquisitionCost: unknown;
      fuelLogs: { totalCost: unknown; liters: unknown }[];
      maintenanceLogs: { cost: unknown }[];
      expenses: { amount: unknown }[];
      trips: { revenue: unknown; actualDistanceKm: unknown }[];
    }) => {
      const fuelCost = v.fuelLogs.reduce((s: number, f: { totalCost: unknown }) => s + Number(f.totalCost), 0);
      const maintenanceCost = v.maintenanceLogs.reduce((s: number, m: { cost: unknown }) => s + Number(m.cost), 0);
      const otherExpenses = v.expenses.reduce((s: number, e: { amount: unknown }) => s + Number(e.amount), 0);
      const totalCost = fuelCost + maintenanceCost + otherExpenses;
      const totalRevenue = v.trips.reduce((s: number, t: { revenue: unknown }) => s + Number(t.revenue ?? 0), 0);
      const acquisitionCost = Number(v.acquisitionCost);
      const roi =
        acquisitionCost > 0
          ? Math.round(((totalRevenue - totalCost) / acquisitionCost) * 100 * 10) / 10
          : 0;
      return {
        id: v.id,
        regNo: v.regNo,
        name: v.name,
        type: v.type,
        status: v.status,
        acquisitionCost,
        fuelCost: Math.round(fuelCost),
        maintenanceCost: Math.round(maintenanceCost),
        otherExpenses: Math.round(otherExpenses),
        totalCost: Math.round(totalCost),
        totalRevenue: Math.round(totalRevenue),
        roi,
      };
    });

    // ── KPI: Average ROI ─────────────────────────────────
    const avgRoi =
      vehicleAgg.length > 0
        ? Math.round((vehicleAgg.reduce((s: number, v: VehicleAggRow) => s + v.roi, 0) / vehicleAgg.length) * 10) / 10
        : 0;

    // ── Top 5 costliest vehicles (horizontal bar) ─────────
    const top5Costly = [...vehicleAgg]
      .sort((a: VehicleAggRow, b: VehicleAggRow) => b.totalCost - a.totalCost)
      .slice(0, 5)
      .map((v: VehicleAggRow) => ({ name: v.regNo, totalCost: v.totalCost, type: v.type }));

    // ── Monthly revenue vs cost (last 6 months) ───────────
    const revMap: Record<string, { revenue: number; fuelCost: number }> = {};

    monthlyData.forEach((t: { createdAt: Date; revenue: unknown }) => {
      const key = t.createdAt.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (!revMap[key]) revMap[key] = { revenue: 0, fuelCost: 0 };
      revMap[key].revenue += Number(t.revenue ?? 0);
    });

    monthlyFuel.forEach((f: { date: Date; totalCost: unknown }) => {
      const key = f.date.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (!revMap[key]) revMap[key] = { revenue: 0, fuelCost: 0 };
      revMap[key].fuelCost += Number(f.totalCost ?? 0);
    });

    const revenueVsCost = Object.entries(revMap).map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue),
      fuelCost: Math.round(data.fuelCost),
    }));

    // ── Fuel efficiency trend by month ────────────────────
    const effMap: Record<string, { distanceKm: number; liters: number }> = {};
    completedTrips.forEach((t: {
      createdAt: Date;
      actualDistanceKm: unknown;
      fuelLogs: { liters: unknown }[];
    }) => {
      const key = t.createdAt.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (!effMap[key]) effMap[key] = { distanceKm: 0, liters: 0 };
      effMap[key].distanceKm += Number(t.actualDistanceKm ?? 0);
      t.fuelLogs.forEach((f: { liters: unknown }) => {
        effMap[key].liters += Number(f.liters ?? 0);
      });
    });

    const efficiencyTrend = Object.entries(effMap)
      .map(([month, data]) => ({
        month,
        kmPerLiter:
          data.liters > 0 ? Math.round((data.distanceKm / data.liters) * 10) / 10 : 0,
      }))
      .filter((row) => row.kmPerLiter > 0);

    return NextResponse.json({
      kpis: {
        fuelEfficiency,
        fleetUtilization,
        totalOperationalCost,
        avgRoi,
      },
      revenueVsCost,
      efficiencyTrend,
      top5Costly,
      vehicleAgg,
    });
  } catch (err: unknown) {
    console.error("[reports] API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
