import { LiveMapPage } from "@/components/live-map/live-map-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Map - TransitOps",
  description: "Live map of all dispatched trips",
};

export default function Page() {
  return <LiveMapPage />;
}
