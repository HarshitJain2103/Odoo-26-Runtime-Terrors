import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDriverSchema } from "@/lib/validations";
import type { Prisma } from "@prisma/client";

// GET /api/drivers?search=&status=&region=&sort=&order=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const region = searchParams.get("region") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const where: Prisma.DriverWhereInput = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { licenseNo: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(status && { status: status as Prisma.EnumDriverStatusFilter }),
    ...(region && { region }),
  };

  const validSortFields: Record<string, boolean> = {
    name: true, licenseNo: true, licenseCategory: true, licenseExpiry: true,
    safetyScore: true, status: true, createdAt: true,
  };
  const orderBy = validSortFields[sort]
    ? { [sort]: order }
    : { createdAt: "desc" as const };

  const drivers = await prisma.driver.findMany({ where, orderBy });

  return NextResponse.json({ drivers });
}

// POST /api/drivers
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createDriverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const existing = await prisma.driver.findUnique({
    where: { licenseNo: parsed.data.licenseNo },
  });
  if (existing) {
    return NextResponse.json(
      { error: "License number already registered" },
      { status: 409 }
    );
  }

  const driver = await prisma.driver.create({
    data: {
      ...parsed.data,
      licenseExpiry: new Date(parsed.data.licenseExpiry),
    },
  });

  return NextResponse.json({ driver }, { status: 201 });
}
