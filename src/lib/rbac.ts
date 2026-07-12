import type { UserRole } from "./constants";
import { RBAC_MATRIX, type AccessLevel } from "@/lib/constants";

/**
 * Check if a role has at least a given access level for a module.
 * Access level hierarchy: FULL > EDIT > CREATE > VIEW > NONE
 */
const ACCESS_HIERARCHY: AccessLevel[] = ["NONE", "VIEW", "CREATE", "EDIT", "FULL"];

export function hasAccess(
  role: UserRole | undefined | null,
  module: string,
  required: AccessLevel
): boolean {
  if (!role) return false;
  const granted = RBAC_MATRIX[role]?.[module] ?? "NONE";
  return ACCESS_HIERARCHY.indexOf(granted) >= ACCESS_HIERARCHY.indexOf(required);
}

export function canView(role: UserRole | undefined | null, module: string) {
  return hasAccess(role, module, "VIEW");
}

export function canCreate(role: UserRole | undefined | null, module: string) {
  return hasAccess(role, module, "CREATE");
}

export function canEdit(role: UserRole | undefined | null, module: string) {
  return hasAccess(role, module, "EDIT");
}

export function canFullAccess(role: UserRole | undefined | null, module: string) {
  return hasAccess(role, module, "FULL");
}
