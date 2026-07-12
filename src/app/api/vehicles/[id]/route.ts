import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateVehicleSchema } from "@/lib/validations";

// PATCH /api/vehicles/[id]
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
  const parsed = updateVehicleSchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...data } = parsed.data;

  // If changing regNo, check uniqueness against other vehicles
  if (data.regNo) {
    const existing = await prisma.vehicle.findFirst({
      where: { regNo: data.regNo.toUpperCase(), NOT: { id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Registration number already exists" },
        { status: 409 }
      );
    }
    data.regNo = data.regNo.toUpperCase();
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data,
  });

  return NextResponse.json({ vehicle });
}

// DELETE /api/vehicles/[id] — soft delete (RETIRED status)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Business rule: cannot retire a vehicle that is ON_TRIP
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  if (vehicle.status === "ON_TRIP") {
    return NextResponse.json(
      { error: "Cannot retire a vehicle that is currently on a trip" },
      { status: 400 }
    );
  }

  const updated = await prisma.vehicle.update({
    where: { id },
    data: { status: "RETIRED" },
  });

  return NextResponse.json({ vehicle: updated });
}
