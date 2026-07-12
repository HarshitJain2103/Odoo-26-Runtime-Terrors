import { TableSkeleton } from "@/components/shared/loading-skeleton";

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="h-8 w-48 skeleton rounded-lg mb-6" />
      <TableSkeleton rows={8} />
    </div>
  );
}
