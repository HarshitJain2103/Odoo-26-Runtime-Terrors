import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema } from "@/lib/validations";

// GET /api/expenses?vehicleId=&category=&sort=&order=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const vehicleId = searchParams.get("vehicleId") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "date";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const expenses = await prisma.expense.findMany({
    where: {
      ...(vehicleId && { vehicleId }),
      ...(category && { category: category as "TOLL" | "PARKING" | "INSURANCE" | "FINE" | "REPAIR" | "OTHER" }),
    },
    orderBy: { [sort]: order },
    include: {
      vehicle: { select: { id: true, regNo: true, name: true } },
      trip: { select: { id: true, code: true } },
    },
  });

  return NextResponse.json({ expenses });
}

// POST /api/expenses
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { vehicleId, tripId, ...rest } = parsed.data;

  const expense = await prisma.expense.create({
    data: {
      ...rest,
      date: new Date(rest.date),
      ...(vehicleId && vehicleId !== "" ? { vehicleId } : {}),
      ...(tripId && tripId !== "" ? { tripId } : {}),
    },
    include: {
      vehicle: { select: { id: true, regNo: true, name: true } },
      trip: { select: { id: true, code: true } },
    },
  });

  return NextResponse.json({ expense }, { status: 201 });
}
