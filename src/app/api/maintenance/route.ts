import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMaintenanceSchema } from "@/lib/validations";

// Tx type derived from prisma instance — avoids Prisma namespace import issues
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// GET /api/maintenance?vehicleId=&status=&sort=&order=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const vehicleId = searchParams.get("vehicleId") ?? "";
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "scheduledDate";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const where: { vehicleId?: string; status?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" } = {
    ...(vehicleId && { vehicleId }),
    ...(status && { status: status as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" }),
  };

  const logs = await prisma.maintenanceLog.findMany({
    where,
    orderBy: { [sort]: order },
    include: {
      vehicle: { select: { id: true, regNo: true, name: true, status: true } },
    },
  });

  return NextResponse.json({ logs });
}

// POST /api/maintenance
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createMaintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const log = await prisma.$transaction(async (tx: Tx) => {
      const vehicle = await tx.vehicle.findUniqueOrThrow({
        where: { id: parsed.data.vehicleId },
      });

      // Business rule: cannot schedule maintenance for ON_TRIP vehicle
      if (vehicle.status === "ON_TRIP") {
        throw new Error("Cannot schedule maintenance for a vehicle currently on a trip");
      }

      const newLog = await tx.maintenanceLog.create({
        data: {
          ...parsed.data,
          scheduledDate: new Date(parsed.data.scheduledDate),
        },
        include: { vehicle: { select: { id: true, regNo: true, name: true } } },
      });

      // Auto-flip: IN_PROGRESS → vehicle = IN_SHOP
      if (parsed.data.status === "IN_PROGRESS") {
        await tx.vehicle.update({
          where: { id: parsed.data.vehicleId },
          data: { status: "IN_SHOP" },
        });
      }

      return newLog;
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
