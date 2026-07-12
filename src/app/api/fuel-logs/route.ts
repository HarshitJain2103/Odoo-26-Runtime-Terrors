import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFuelLogSchema } from "@/lib/validations";

// GET /api/fuel-logs?vehicleId=&tripId=&sort=&order=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const vehicleId = searchParams.get("vehicleId") ?? "";
  const sort = searchParams.get("sort") ?? "date";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const logs = await prisma.fuelLog.findMany({
    where: {
      ...(vehicleId && { vehicleId }),
    },
    orderBy: { [sort]: order },
    include: {
      vehicle: { select: { id: true, regNo: true, name: true } },
      trip: { select: { id: true, code: true } },
    },
  });

  return NextResponse.json({ logs });
}

// POST /api/fuel-logs
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createFuelLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { tripId, ...rest } = parsed.data;

  const log = await prisma.fuelLog.create({
    data: {
      ...rest,
      date: new Date(rest.date),
      totalCost: Number(rest.liters) * Number(rest.costPerLiter),
      ...(tripId && tripId !== "" ? { tripId } : {}),
    },
    include: {
      vehicle: { select: { id: true, regNo: true, name: true } },
      trip: { select: { id: true, code: true } },
    },
  });

  return NextResponse.json({ log }, { status: 201 });
}
