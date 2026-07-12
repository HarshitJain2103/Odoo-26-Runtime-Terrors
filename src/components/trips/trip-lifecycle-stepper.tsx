import { CheckCircle, Circle, XCircle } from "lucide-react";
import type { TripStatus } from "@prisma/client";

const STEPS = [
  { key: "DRAFT", label: "Draft" },
  { key: "DISPATCHED", label: "Dispatched" },
  { key: "COMPLETED", label: "Completed" },
] as const;

interface TripLifecycleStepperProps {
  status: TripStatus;
}

export function TripLifecycleStepper({ status }: TripLifecycleStepperProps) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "#dc2626" }}>
        <XCircle size={16} />
        <span className="font-medium">Trip Cancelled</span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center">
                {isDone ? (
                  <CheckCircle size={16} style={{ color: "#16a34a" }} />
                ) : isCurrent ? (
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: "#714b67" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#714b67" }} />
                  </div>
                ) : (
                  <Circle size={16} className="text-gray-300" />
                )}
              </div>
              <span
                className="text-xs mt-0.5 font-medium leading-tight"
                style={{
                  color: isDone ? "#16a34a" : isCurrent ? "#714b67" : "#9ca3af",
                }}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className="w-8 h-0.5 mx-1 mb-3"
                style={{ background: idx < currentIndex ? "#16a34a" : "#e2e8f0" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
