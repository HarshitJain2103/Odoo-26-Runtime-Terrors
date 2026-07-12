import { cn } from "@/lib/utils";
import {
  VEHICLE_STATUS_CONFIG,
  DRIVER_STATUS_CONFIG,
  TRIP_STATUS_CONFIG,
  MAINTENANCE_STATUS_CONFIG,
} from "@/lib/constants";
import type {
  VehicleStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
} from "@/lib/constants";

type StatusConfig = {
  label: string;
  color: string;
  bg: string;
  dot: string;
};

interface StatusBadgeProps {
  status: VehicleStatus | DriverStatus | TripStatus | MaintenanceStatus;
  type: "vehicle" | "driver" | "trip" | "maintenance";
  className?: string;
}

function getConfig(
  type: StatusBadgeProps["type"],
  status: StatusBadgeProps["status"]
): StatusConfig {
  switch (type) {
    case "vehicle":
      return VEHICLE_STATUS_CONFIG[status as VehicleStatus];
    case "driver":
      return DRIVER_STATUS_CONFIG[status as DriverStatus];
    case "trip":
      return TRIP_STATUS_CONFIG[status as TripStatus];
    case "maintenance":
      return MAINTENANCE_STATUS_CONFIG[status as MaintenanceStatus];
  }
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const config = getConfig(type, status);

  return (
    <span className={cn("badge", config.bg, config.color, className)}>
      <span className={cn("badge-dot", config.dot)} />
      {config.label}
    </span>
  );
}
