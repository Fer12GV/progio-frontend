import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@/context/AuthContext.jsx";
import LoginPage from "@/pages/LoginPage.jsx";
import HomePage from "@/pages/HomePage.jsx";

function ProtectedRoute({ children }) {
  const { accessToken, validating } = useAuth();
  if (validating) {
    return <p className="muted">Comprobando sesión…</p>;
  }
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
