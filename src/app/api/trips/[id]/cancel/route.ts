import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tx type derived from prisma instance — avoids Prisma namespace import issues
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

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
    const result = await prisma.$transaction(async (tx: Tx) => {
      const trip = await tx.trip.findUniqueOrThrow({
        where: { id: tripId },
        include: { vehicle: true, driver: true },
      });

      if (!["DRAFT", "DISPATCHED"].includes(trip.status)) {
        throw new Error("Only DRAFT or DISPATCHED trips can be cancelled");
      }

      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
        include: {
          vehicle: { select: { id: true, regNo: true, name: true } },
          driver: { select: { id: true, name: true } },
        },
      });

      if (trip.status === "DISPATCHED") {
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } });
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
      }

      // Audit log
      const userId = (session.user as { id: string }).id;
      await tx.auditLog.create({
        data: {
          userId,
          action: "CANCEL",
          entity: "Trip",
          entityId: tripId,
          previousData: { status: trip.status },
          newData: { status: "CANCELLED" },
        },
      });

      return updatedTrip;
    }, { maxWait: 5000, timeout: 20000 });

    return NextResponse.json({ trip: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancel failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
