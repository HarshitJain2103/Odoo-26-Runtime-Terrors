import { redirect } from "next/navigation";

// Root "/" redirects to the (dashboard) route group's page
export default function RootPage() {
  redirect("/dashboard");
}
