import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tx type derived from prisma instance — avoids Prisma namespace import issues
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// POST /api/trips/[id]/dispatch
// Transaction: verify availability → update trip + vehicle + driver atomically
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
      // Load the trip
      const trip = await tx.trip.findUniqueOrThrow({
        where: { id: tripId },
        include: { vehicle: true, driver: true },
      });

      if (trip.status !== "DRAFT") {
        throw new Error("Only DRAFT trips can be dispatched");
      }

      // Rule 2: Vehicle must be AVAILABLE
      if (trip.vehicle.status !== "AVAILABLE") {
        throw new Error(`Vehicle "${trip.vehicle.regNo}" is not available (status: ${trip.vehicle.status})`);
      }

      // Rule 3: Driver must be AVAILABLE + license not expired
      if (trip.driver.status !== "AVAILABLE") {
        throw new Error(`Driver "${trip.driver.name}" is not available (status: ${trip.driver.status})`);
      }
      if (new Date(trip.driver.licenseExpiry) < new Date()) {
        throw new Error(`Driver "${trip.driver.name}" has an expired license`);
      }

      // Rule 5: Cargo weight ≤ vehicle capacity
      if (Number(trip.cargoWeightKg) > Number(trip.vehicle.capacityKg)) {
        throw new Error(`Cargo weight exceeds vehicle capacity (${trip.cargoWeightKg} kg > ${trip.vehicle.capacityKg} kg)`);
      }

      const userId = (session.user as { id: string }).id;

      // Rule 6: Dispatch → vehicle + driver = ON_TRIP
      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          status: "DISPATCHED",
          dispatchedAt: new Date(),
        },
        include: {
          vehicle: { select: { id: true, regNo: true, name: true } },
          driver: { select: { id: true, name: true } },
        },
      });
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "ON_TRIP" },
      });
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: "ON_TRIP" },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: "DISPATCH",
          entity: "Trip",
          entityId: tripId,
          previousData: { status: "DRAFT" },
          newData: { status: "DISPATCHED", vehicleId: trip.vehicleId, driverId: trip.driverId },
        },
      });

      return updatedTrip;
    }, { maxWait: 5000, timeout: 20000 });

    return NextResponse.json({ trip: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dispatch failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
