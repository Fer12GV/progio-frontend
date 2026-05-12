import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/auth/ProtectedRoute.jsx";
import RoleGuard from "@/components/auth/RoleGuard.jsx";
import AppLayout from "@/components/layout/AppLayout.jsx";
import LoginPage from "@/pages/LoginPage.jsx";
import HomePage from "@/pages/HomePage.jsx";
import OperatorPanelPage from "@/pages/OperatorPanelPage.jsx";
import ServiceDetailPage from "@/pages/ServiceDetailPage.jsx";
import ServicesPage from "@/pages/ServicesPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route
          path="/operator"
          element={
            <RoleGuard roles={["operario"]} redirectTo="/">
              <OperatorPanelPage />
            </RoleGuard>
          }
        />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
