import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTripSchema } from "@/lib/validations";
import { generateTripCode } from "@/lib/utils";
import type { TripStatus } from "@prisma/client";

// GET /api/trips?status=&vehicleId=&driverId=&sort=&order=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const trips = await prisma.trip.findMany({
    where: {
      ...(status && { status: status as TripStatus }),
    },
    orderBy: { [sort]: order },
    include: {
      vehicle: { select: { id: true, regNo: true, name: true, capacityKg: true, status: true } },
      driver: { select: { id: true, name: true, licenseNo: true, status: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ trips });
}

// POST /api/trips — create DRAFT
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Validate cargo vs capacity upfront
  const vehicle = await prisma.vehicle.findUnique({ where: { id: parsed.data.vehicleId } });
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  if (Number(parsed.data.cargoWeightKg) > Number(vehicle.capacityKg)) {
    return NextResponse.json(
      { error: `Cargo weight (${parsed.data.cargoWeightKg} kg) exceeds vehicle capacity (${vehicle.capacityKg} kg)` },
      { status: 400 }
    );
  }

  const userId = (session.user as { id: string }).id;

  const trip = await prisma.trip.create({
    data: {
      ...parsed.data,
      code: generateTripCode(),
      createdById: userId,
      status: "DRAFT",
    },
    include: {
      vehicle: { select: { id: true, regNo: true, name: true, capacityKg: true } },
      driver: { select: { id: true, name: true, licenseNo: true } },
    },
  });

  return NextResponse.json({ trip }, { status: 201 });
}
