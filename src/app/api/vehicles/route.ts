import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVehicleSchema } from "@/lib/validations";
import type { Prisma } from "@prisma/client";

// GET /api/vehicles?search=&type=&status=&region=&sort=&order=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";
  const region = searchParams.get("region") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const where: Prisma.VehicleWhereInput = {
    ...(search && {
      OR: [
        { regNo: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(type && { type: type as Prisma.EnumVehicleTypeFilter }),
    ...(status && { status: status as Prisma.EnumVehicleStatusFilter }),
    ...(region && { region }),
  };

  const validSortFields: Record<string, boolean> = {
    regNo: true, name: true, type: true, capacityKg: true,
    odometer: true, acquisitionCost: true, status: true, createdAt: true,
  };
  const orderBy = validSortFields[sort]
    ? { [sort]: order }
    : { createdAt: "desc" as const };

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy,
  });

  return NextResponse.json({ vehicles });
}

// POST /api/vehicles
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Check reg number uniqueness
  const existing = await prisma.vehicle.findUnique({
    where: { regNo: parsed.data.regNo.toUpperCase() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Registration number already exists" },
      { status: 409 }
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ...parsed.data,
      regNo: parsed.data.regNo.toUpperCase(),
    },
  });

  return NextResponse.json({ vehicle }, { status: 201 });
}
