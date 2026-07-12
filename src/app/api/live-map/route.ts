import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Only fetch trips that are DISPATCHED and have coordinate data
    const activeTrips = await prisma.trip.findMany({
      where: {
        status: "DISPATCHED",
        sourceLat: { not: null },
        sourceLng: { not: null },
        destLat: { not: null },
        destLng: { not: null },
      },
      select: {
        id: true,
        code: true,
        source: true,
        destination: true,
        sourceLat: true,
        sourceLng: true,
        destLat: true,
        destLng: true,
        routeGeoJson: true,
        cargoWeightKg: true,
        vehicle: {
          select: {
            regNo: true,
            name: true,
          }
        },
        driver: {
          select: {
            name: true,
          }
        }
      }
    });

    // Filter out trips without routeGeoJson
    const tripsWithGeoJson = activeTrips.filter(t => t.routeGeoJson);

    return NextResponse.json({ trips: tripsWithGeoJson });
  } catch (error) {
    console.error("Failed to fetch live map trips:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
