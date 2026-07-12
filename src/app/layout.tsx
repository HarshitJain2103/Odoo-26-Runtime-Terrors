import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TransitOps — Smart Transport Operations",
  description:
    "Centralized platform for vehicle, driver, dispatch, maintenance, and expense management with operational insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
