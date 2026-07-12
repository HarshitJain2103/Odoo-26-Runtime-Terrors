import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

const updateStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED"]),
  completedDate: z.string().optional(),
  cost: z.number({ coerce: true }).min(0).optional(),
  description: z.string().optional(),
});

// PATCH /api/maintenance/[id]
// State: SCHEDULED → IN_PROGRESS (vehicle → IN_SHOP)
//        IN_PROGRESS → COMPLETED  (vehicle → AVAILABLE)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx: Tx) => {
      const log = await tx.maintenanceLog.findUniqueOrThrow({
        where: { id },
        include: { vehicle: true },
      });

      const { status, completedDate, cost, description } = parsed.data;

      // State transition: IN_PROGRESS → vehicle = IN_SHOP
      if (status === "IN_PROGRESS" && log.status !== "IN_PROGRESS") {
        if (log.vehicle.status === "ON_TRIP") {
          throw new Error("Vehicle is currently on a trip");
        }
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: "IN_SHOP" },
        });
      }

      // State transition: COMPLETED → vehicle = AVAILABLE (unless RETIRED)
      if (status === "COMPLETED" && log.status !== "COMPLETED") {
        if (log.vehicle.status !== "RETIRED") {
          await tx.vehicle.update({
            where: { id: log.vehicleId },
            data: { status: "AVAILABLE" },
          });
        }
      }

      const updated = await tx.maintenanceLog.update({
        where: { id },
        data: {
          status,
          ...(completedDate && { completedDate: new Date(completedDate) }),
          ...(cost !== undefined && { cost }),
          ...(description !== undefined && { description }),
        },
        include: { vehicle: { select: { id: true, regNo: true, name: true } } },
      });

      // Audit log for status transitions
      const userId = (session.user as { id: string }).id;
      await tx.auditLog.create({
        data: {
          userId,
          action: "MAINTENANCE_STATUS_UPDATE",
          entity: "MaintenanceLog",
          entityId: id,
          previousData: { status: log.status },
          newData: { status, vehicleId: log.vehicleId },
        },
      });

      return updated;
    });

    return NextResponse.json({ log: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/maintenance/[id] — only SCHEDULED records can be deleted
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const log = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!log) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }
  if (log.status !== "SCHEDULED") {
    return NextResponse.json(
      { error: "Only SCHEDULED maintenance records can be deleted" },
      { status: 400 }
    );
  }

  await prisma.maintenanceLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
