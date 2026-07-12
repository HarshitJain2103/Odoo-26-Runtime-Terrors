import { auth } from "@/lib/auth";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { ROLE_LABELS } from "@/lib/constants";

export default async function DashboardRoute() {
  const session = await auth();
  const user = session!.user as { name?: string | null; role: keyof typeof ROLE_LABELS };

  return (
    <DashboardPage
      userName={user.name ?? "User"}
      userRole={ROLE_LABELS[user.role]}
    />
  );
}
