import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeTripSchema } from "@/lib/validations";

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
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUniqueOrThrow({
        where: { id: tripId },
        include: { vehicle: true, driver: true },
      });

      if (trip.status !== "DISPATCHED") {
        throw new Error("Only DISPATCHED trips can be completed");
      }

      // Rule 7: Complete → vehicle + driver = AVAILABLE, update odometer
      const [updatedTrip] = await Promise.all([
        tx.trip.update({
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
        }),
        tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: {
            status: "AVAILABLE",
            ...(finalOdometer && { odometer: finalOdometer }),
          },
        }),
        tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }),
      ]);

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

      return updatedTrip;
    });

    return NextResponse.json({ trip: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Complete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
