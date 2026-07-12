import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeTripSchema } from "@/lib/validations";

// Tx type derived from prisma instance — avoids Prisma namespace import issues
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// POST /api/trips/[id]/complete
// Transaction: complete trip → update odometer + restore vehicle + driver status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await params;
  const body = await req.json();
  const parsed = completeTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { actualDistanceKm, revenue, completionNotes, fuelConsumed, fuelCostPerLiter, finalOdometer } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx: Tx) => {
      const trip = await tx.trip.findUniqueOrThrow({
        where: { id: tripId },
        include: { vehicle: true, driver: true },
      });

      if (trip.status !== "DISPATCHED") {
        throw new Error("Only DISPATCHED trips can be completed");
      }

      // Rule 7: Complete → vehicle + driver = AVAILABLE, update odometer
      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          actualDistanceKm,
          revenue: revenue ?? null,
          completionNotes: completionNotes ?? null,
        },
        include: {
          vehicle: { select: { id: true, regNo: true, name: true } },
          driver: { select: { id: true, name: true } },
        },
      });
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: "AVAILABLE",
          ...(finalOdometer && { odometer: finalOdometer }),
        },
      });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });

      // Create fuel log if fuel data provided
      if (fuelConsumed && fuelCostPerLiter) {
        await tx.fuelLog.create({
          data: {
            vehicleId: trip.vehicleId,
            tripId,
            date: new Date(),
            liters: fuelConsumed,
            costPerLiter: fuelCostPerLiter,
            totalCost: fuelConsumed * fuelCostPerLiter,
            odometerAtFill: finalOdometer ?? null,
          },
        });
      }

      // Audit log
      const userId = (session.user as { id: string }).id;
      await tx.auditLog.create({
        data: {
          userId,
          action: "COMPLETE",
          entity: "Trip",
          entityId: tripId,
          previousData: { status: "DISPATCHED" },
          newData: { status: "COMPLETED", actualDistanceKm, revenue: revenue ?? null },
        },
      });

      return updatedTrip;
    }, { maxWait: 5000, timeout: 20000 });

    return NextResponse.json({ trip: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Complete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
