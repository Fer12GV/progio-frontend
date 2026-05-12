import { useMemo } from "react";

import { FINANCE_VISIBLE_ROLES } from "@/constants/rbacFinance.js";

import { useRole } from "./useRole.js";

/**
 * @returns {boolean} true si el JWT permite ver precios, totales y detalle económico en la UI.
 */
export function useCanSeeFinance() {
  const { hasAny } = useRole();
  return useMemo(() => hasAny(FINANCE_VISIBLE_ROLES), [hasAny]);
}
