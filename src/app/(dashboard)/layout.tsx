import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ROLE_LABELS } from "@/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    role: keyof typeof ROLE_LABELS;
  };

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
        {/* Spacer for fixed sidebar */}
        <div className="w-16 flex-shrink-0 transition-all duration-300" />
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Topbar */}
          <Topbar
            userName={user.name ?? "User"}
            userEmail={user.email ?? ""}
            userRole={user.role}
          />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
