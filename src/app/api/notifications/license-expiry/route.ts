import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLicenseExpiryAlert } from "@/lib/mailer";

// POST /api/notifications/license-expiry
// Scans for expired/expiring drivers and emails ADMIN, FLEET_MANAGER, SAFETY_OFFICER.
// Can be called manually from the UI or triggered via an external cron job.
// To call without session auth (from cron), include the header:
//   x-cron-secret: <value of CRON_SECRET env var>
export async function POST(req: NextRequest) {
  try {
    // Allow either a valid session OR a cron secret (for server-side cron callers)
    const cronSecret = req.headers.get("x-cron-secret");
    const isValidCron =
      cronSecret && cronSecret === process.env.CRON_SECRET;

    if (!isValidCron) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. Fetch all drivers with expired or expiring-soon licenses
    const [expiredRaw, expiringSoonRaw] = await Promise.all([
      // Already expired
      prisma.driver.findMany({
        where: { licenseExpiry: { lt: now } },
        select: {
          name: true,
          licenseNo: true,
          licenseExpiry: true,
          status: true,
          region: true,
        },
        orderBy: { licenseExpiry: "asc" },
      }),
      // Expiring within the next 30 days
      prisma.driver.findMany({
        where: {
          licenseExpiry: { gte: now, lte: in30Days },
        },
        select: {
          name: true,
          licenseNo: true,
          licenseExpiry: true,
          status: true,
          region: true,
        },
        orderBy: { licenseExpiry: "asc" },
      }),
    ]);

    const totalAffected = expiredRaw.length + expiringSoonRaw.length;

    if (totalAffected === 0) {
      return NextResponse.json({
        success: true,
        message: "No drivers with expired or expiring licenses. No emails sent.",
        stats: { expired: 0, expiringSoon: 0, emailsSent: 0 },
      });
    }

    // Map to DriverLicenseEntry (add daysRemaining)
    const expired = expiredRaw.map((d) => ({
      ...d,
      licenseExpiry: d.licenseExpiry,
      daysRemaining: Math.floor(
        (d.licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ), // will be negative
    }));

    const expiringSoon = expiringSoonRaw.map((d) => ({
      ...d,
      licenseExpiry: d.licenseExpiry,
      daysRemaining: Math.ceil(
        (d.licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    // 2. Fetch recipients: ADMIN, FLEET_MANAGER, SAFETY_OFFICER
    const dbRecipients = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER"] },
        isActive: true,
      },
      select: { name: true, email: true, role: true },
    });

    if (dbRecipients.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No eligible recipients (ADMIN / FLEET_MANAGER / SAFETY_OFFICER) found.",
        stats: { expired: expired.length, expiringSoon: expiringSoon.length, emailsSent: 0 },
      });
    }

    // 3. Resolve actual delivery addresses.
    //    When NOTIFY_OVERRIDE_EMAIL is set (dev/demo mode), send ONE email to that
    //    address only — avoids bouncing on fake DB emails.
    const overrideEmail = process.env.NOTIFY_OVERRIDE_EMAIL?.trim();
    const effectiveRecipients = overrideEmail
      ? [{ name: "TransitOps Admin (Override)", email: overrideEmail, role: "ADMIN" as const }]
      : dbRecipients;

    // 4. Send emails
    const results: { email: string; success: boolean; error?: string }[] = [];

    await Promise.allSettled(
      effectiveRecipients.map(async (r) => {
        try {
          await sendLicenseExpiryAlert({
            to: { name: r.name, email: r.email },
            expiredDrivers: expired,
            expiringSoonDrivers: expiringSoon,
          });
          results.push({ email: r.email, success: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          results.push({ email: r.email, success: false, error: msg });
        }
      })
    );

    const recipients = effectiveRecipients;

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);
    const modeNote = overrideEmail ? ` (override → ${overrideEmail})` : "";

    return NextResponse.json({
      success: true,
      message: `License expiry alert sent to ${sent}/${effectiveRecipients.length} recipient(s)${modeNote}.`,
      stats: {
        expired: expired.length,
        expiringSoon: expiringSoon.length,
        emailsSent: sent,
        emailsFailed: failed.length,
      },
      details: results,
    });
  } catch (err) {
    console.error("[notifications/license-expiry]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/notifications/license-expiry
// Returns a preview of affected drivers without sending emails — useful for the UI.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [expiredRaw, expiringSoonRaw, recipients] = await Promise.all([
      prisma.driver.findMany({
        where: { licenseExpiry: { lt: now } },
        select: { name: true, licenseNo: true, licenseExpiry: true, status: true, region: true },
        orderBy: { licenseExpiry: "asc" },
      }),
      prisma.driver.findMany({
        where: { licenseExpiry: { gte: now, lte: in30Days } },
        select: { name: true, licenseNo: true, licenseExpiry: true, status: true, region: true },
        orderBy: { licenseExpiry: "asc" },
      }),
      prisma.user.findMany({
        where: { role: { in: ["ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER"] }, isActive: true },
        select: { name: true, email: true, role: true },
      }),
    ]);

    // Apply override: if set, UI shows the override address (not fake DB emails)
    const overrideEmail = process.env.NOTIFY_OVERRIDE_EMAIL?.trim();
    const effectiveRecipients = overrideEmail
      ? [{ name: "TransitOps Admin (Override)", email: overrideEmail, role: "ADMIN" }]
      : recipients.map((r) => ({ name: r.name, email: r.email, role: r.role }));

    return NextResponse.json({
      overrideActive: !!overrideEmail,
      expired: expiredRaw.map((d) => ({
        ...d,
        daysRemaining: Math.floor((d.licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      expiringSoon: expiringSoonRaw.map((d) => ({
        ...d,
        daysRemaining: Math.ceil((d.licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      recipients: effectiveRecipients,
    });
  } catch (err) {
    console.error("[notifications/license-expiry GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
