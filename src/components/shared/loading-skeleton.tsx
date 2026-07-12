import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="surface-card overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
        {[40, 20, 20, 20].map((w, i) => (
          <div key={i} className="skeleton h-4 rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          {[40, 20, 20, 20].map((w, j) => (
            <div key={j} className="skeleton h-4 rounded" style={{ width: `${w}%`, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("kpi-card", className)}>
      <div className="skeleton h-3 w-24 rounded mb-3" />
      <div className="skeleton h-7 w-16 rounded mb-2" />
      <div className="skeleton h-3 w-32 rounded" />
    </div>
  );
}

export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
