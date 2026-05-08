import { Navigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext.jsx";

/**
 * Rutas que exigen sesión. Mientras `validating`, muestra estado de carga.
 *
 * @param {{ children: import('react').ReactNode, redirectTo?: string }} props
 */
export default function ProtectedRoute({ children, redirectTo = "/login" }) {
  const { accessToken, validating } = useAuth();

  if (validating) {
    return <p className="muted">Comprobando sesión…</p>;
  }

  if (!accessToken) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
