import { useCallback, useMemo } from "react";

import { useAuth } from "@/context/AuthContext.jsx";

/**
 * Roles desde el JWT vía `user.roles` (sin enviar tenant_id al cliente).
 *
 * @returns {{ roles: string[], hasAny: (required: string[]) => boolean, hasAll: (required: string[]) => boolean }}
 */
export function useRole() {
  const { user } = useAuth();

  const roles = useMemo(() => {
    const raw = user?.roles;
    return Array.isArray(raw) ? raw : [];
  }, [user?.roles]);

  const hasAll = useCallback(
    (required) => {
      if (!required?.length) {
        return true;
      }
      return required.every((role) => roles.includes(role));
    },
    [roles],
  );

  const hasAny = useCallback(
    (required) => {
      if (!required?.length) {
        return true;
      }
      return required.some((role) => roles.includes(role));
    },
    [roles],
  );

  return { roles, hasAny, hasAll };
}
