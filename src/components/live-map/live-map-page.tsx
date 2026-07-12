"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const LiveMapClient = dynamic(() => import("./live-map-client"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  ),
});

export function LiveMapPage() {
  return <LiveMapClient />;
}
