import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/trips/[id]/cancel
// Rule 8: Cancel dispatched trip → restore vehicle + driver to AVAILABLE
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUniqueOrThrow({
        where: { id: tripId },
        include: { vehicle: true, driver: true },
      });

      if (!["DRAFT", "DISPATCHED"].includes(trip.status)) {
        throw new Error("Only DRAFT or DISPATCHED trips can be cancelled");
      }

      const [updatedTrip] = await Promise.all([
        tx.trip.update({
          where: { id: tripId },
          data: { status: "CANCELLED", cancelledAt: new Date() },
          include: {
            vehicle: { select: { id: true, regNo: true, name: true } },
            driver: { select: { id: true, name: true } },
          },
        }),
        // Only restore vehicle + driver if they were set to ON_TRIP
        ...(trip.status === "DISPATCHED"
          ? [
              tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } }),
              tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }),
            ]
          : []),
      ]);

      return updatedTrip;
    });

    return NextResponse.json({ trip: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancel failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
