import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/fuel-expenses/summary
// Returns: summary cards + per-vehicle breakdown
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Parallel aggregations
  const [
    fuelTotal,
    fuelThisMonth,
    maintenanceTotal,
    expensesTotal,
    vehicles,
  ] = await Promise.all([
    // Total fuel cost (all time)
    prisma.fuelLog.aggregate({ _sum: { totalCost: true } }),

    // Fuel cost this month
    prisma.fuelLog.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { totalCost: true },
    }),

    // Total maintenance cost
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),

    // Total other expenses
    prisma.expense.aggregate({ _sum: { amount: true } }),

    // Per-vehicle breakdown
    prisma.vehicle.findMany({
      select: {
        id: true,
        regNo: true,
        name: true,
        type: true,
        status: true,
        fuelLogs: { select: { totalCost: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } },
      },
    }),
  ]);

  const totalFuel = Number(fuelTotal._sum.totalCost ?? 0);
  const totalFuelThisMonth = Number(fuelThisMonth._sum.totalCost ?? 0);
  const totalMaintenance = Number(maintenanceTotal._sum.cost ?? 0);
  const totalExpenses = Number(expensesTotal._sum.amount ?? 0);
  const totalOperational = totalFuel + totalMaintenance + totalExpenses;

  // Per-vehicle breakdown
  const breakdown = vehicles.map((v: {
    id: string;
    regNo: string;
    name: string;
    type: string;
    status: string;
    fuelLogs: { totalCost: unknown }[];
    maintenanceLogs: { cost: unknown }[];
    expenses: { amount: unknown }[];
  }) => {
    const fuel = v.fuelLogs.reduce((s: number, f: { totalCost: unknown }) => s + Number(f.totalCost), 0);
    const maintenance = v.maintenanceLogs.reduce((s: number, m: { cost: unknown }) => s + Number(m.cost), 0);
    const other = v.expenses.reduce((s: number, e: { amount: unknown }) => s + Number(e.amount), 0);
    return {
      id: v.id,
      regNo: v.regNo,
      name: v.name,
      type: v.type,
      status: v.status,
      fuel,
      maintenance,
      other,
      total: fuel + maintenance + other,
    };
  }).sort((a: { total: number }, b: { total: number }) => b.total - a.total);

  return NextResponse.json({
    summary: {
      totalFuel,
      totalFuelThisMonth,
      totalMaintenance,
      totalExpenses,
      totalOperational,
    },
    breakdown,
  });
}
