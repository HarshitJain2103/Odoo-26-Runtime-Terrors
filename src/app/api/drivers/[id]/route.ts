import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDriverSchema } from "@/lib/validations";

// PATCH /api/drivers/[id]
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
  const parsed = updateDriverSchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, licenseExpiry, ...rest } = parsed.data;
  const data = {
    ...rest,
    ...(licenseExpiry && { licenseExpiry: new Date(licenseExpiry) }),
  };

  // Check license uniqueness if updating
  if (rest.licenseNo) {
    const existing = await prisma.driver.findFirst({
      where: { licenseNo: rest.licenseNo, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "License number already registered" },
        { status: 409 }
      );
    }
  }

  const driver = await prisma.driver.update({ where: { id }, data });
  return NextResponse.json({ driver });
}

// DELETE /api/drivers/[id] — soft delete (SUSPENDED)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }
  if (driver.status === "ON_TRIP") {
    return NextResponse.json(
      { error: "Cannot suspend a driver currently on a trip" },
      { status: 400 }
    );
  }

  const updated = await prisma.driver.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });

  return NextResponse.json({ driver: updated });
}
