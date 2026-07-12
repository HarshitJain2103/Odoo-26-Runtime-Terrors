import nodemailer from "nodemailer";

// ─── Transporter singleton ────────────────────────────────────────────────────
// Uses SMTP credentials from .env. Works with Gmail (App Password), Mailtrap,
// SendGrid SMTP, or any standard SMTP provider.
let transporter: nodemailer.Transporter | null = null;

export function getMailTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: (process.env.SMTP_PORT ?? "587") === "465", // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

// ─── Email Templates ──────────────────────────────────────────────────────────

interface DriverLicenseEntry {
  name: string;
  licenseNo: string;
  licenseExpiry: Date;
  status: string;
  region: string;
  daysRemaining: number; // negative = already expired
}

function buildLicenseExpiryEmail(
  recipientName: string,
  expiredDrivers: DriverLicenseEntry[],
  expiringSoonDrivers: DriverLicenseEntry[]
): string {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const expiredRows = expiredDrivers
    .map(
      (d) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827">${d.name}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-family:monospace">${d.licenseNo}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;color:#6b7280">${d.region}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6">
          <span style="background:#fee2e2;color:#dc2626;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">
            EXPIRED ${Math.abs(d.daysRemaining)} days ago
          </span>
        </td>
      </tr>`
    )
    .join("");

  const soonRows = expiringSoonDrivers
    .map(
      (d) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827">${d.name}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-family:monospace">${d.licenseNo}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;color:#6b7280">${d.region}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6">
          <span style="background:#fef3c7;color:#d97706;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">
            Expires in ${d.daysRemaining} days
          </span>
        </td>
      </tr>`
    )
    .join("");

  const expiredSection =
    expiredDrivers.length > 0
      ? `
    <div style="margin-bottom:28px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="background:#fee2e2;color:#dc2626;width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:18px">⚠️</span>
        <h3 style="margin:0;font-size:15px;font-weight:700;color:#dc2626">
          ${expiredDrivers.length} Driver${expiredDrivers.length > 1 ? "s" : ""} — License Already Expired
        </h3>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #fee2e2">
        <thead>
          <tr style="background:#fef2f2">
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em">Driver</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em">License No.</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em">Region</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em">Status</th>
          </tr>
        </thead>
        <tbody>${expiredRows}</tbody>
      </table>
    </div>`
      : "";

  const soonSection =
    expiringSoonDrivers.length > 0
      ? `
    <div style="margin-bottom:28px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="background:#fef3c7;color:#d97706;width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:18px">⏰</span>
        <h3 style="margin:0;font-size:15px;font-weight:700;color:#d97706">
          ${expiringSoonDrivers.length} Driver${expiringSoonDrivers.length > 1 ? "s" : ""} — License Expiring Soon (within 30 days)
        </h3>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #fde68a">
        <thead>
          <tr style="background:#fffbeb">
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:0.05em">Driver</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:0.05em">License No.</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:0.05em">Region</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:0.05em">Expires In</th>
          </tr>
        </thead>
        <tbody>${soonRows}</tbody>
      </table>
    </div>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>TransitOps — Driver License Alert</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#714b67 0%,#2d2845 100%);border-radius:14px 14px 0 0;padding:32px 36px">
              <table width="100%">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em">TransitOps</p>
                    <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff">Driver License Alert 🪪</h1>
                    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.55)">${today}</p>
                  </td>
                  <td align="right">
                    <div style="width:52px;height:52px;background:rgba(255,255,255,0.12);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:26px;line-height:52px;text-align:center">🚨</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:32px 36px">
              
              <p style="margin:0 0 8px;color:#374151;font-size:15px">Hello, <strong>${recipientName}</strong> 👋</p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6">
                This is your scheduled <strong>license compliance report</strong> from TransitOps.
                Immediate action may be required for the drivers listed below to ensure fleet compliance and road safety.
              </p>

              ${expiredSection}
              ${soonSection}

              <!-- Action box -->
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:28px">
                <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#166534">✅ Recommended Actions</p>
                <ul style="margin:0;padding-left:18px;color:#15803d;font-size:13px;line-height:2">
                  <li>Contact affected drivers to schedule license renewal</li>
                  <li>Consider suspending expired-license drivers from active trips</li>
                  <li>Update license details in TransitOps once renewed</li>
                </ul>
              </div>

              <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/drivers"
                style="display:inline-block;background:linear-gradient(135deg,#714b67,#2d2845);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:700">
                View All Drivers →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-radius:0 0 14px 14px;padding:20px 36px;border-top:1px solid #e5e7eb">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center">
                This is an automated alert from <strong>TransitOps</strong>. Do not reply to this email.<br/>
                To manage notification settings, visit <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/settings" style="color:#714b67">Settings</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send License Expiry Alert ────────────────────────────────────────────────

export async function sendLicenseExpiryAlert(opts: {
  to: { name: string; email: string };
  expiredDrivers: DriverLicenseEntry[];
  expiringSoonDrivers: DriverLicenseEntry[];
}) {
  const mailer = getMailTransporter();
  const total = opts.expiredDrivers.length + opts.expiringSoonDrivers.length;

  await mailer.sendMail({
    from: `"TransitOps Alerts" <${process.env.SMTP_USER}>`,
    to: `"${opts.to.name}" <${opts.to.email}>`,
    subject: `🚨 [TransitOps] ${total} Driver License${total > 1 ? "s" : ""} Require Attention`,
    html: buildLicenseExpiryEmail(
      opts.to.name,
      opts.expiredDrivers,
      opts.expiringSoonDrivers
    ),
  });
}
