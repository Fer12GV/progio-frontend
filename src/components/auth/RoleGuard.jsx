import { Navigate } from "react-router-dom";

import { useRole } from "@/hooks/useRole.js";

/**
 * Oculta `children` si el usuario no tiene los roles requeridos (defensa en profundidad en UI).
 *
 * @param {{
 *   roles: string[],
 *   requireAll?: boolean,
 *   children: import('react').ReactNode,
 *   fallback?: import('react').ReactNode,
 *   redirectTo?: string,
 * }} props
 */
export default function RoleGuard({
  roles: requiredRoles,
  requireAll = false,
  children,
  fallback = null,
  redirectTo,
}) {
  const { hasAny, hasAll } = useRole();

  const allowed = requireAll ? hasAll(requiredRoles) : hasAny(requiredRoles);

  if (allowed) {
    return children;
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return fallback;
}
