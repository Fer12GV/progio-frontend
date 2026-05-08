import { useState } from "react";

import Badge from "@/components/common/Badge.jsx";
import Button from "@/components/common/Button.jsx";
import Card from "@/components/common/Card.jsx";
import Select from "@/components/common/Select.jsx";
import RoleGuard from "@/components/auth/RoleGuard.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import { useToast } from "@/hooks/useToast.js";
import { formatRoleLabel } from "@/utils/roleLabels.js";

import styles from "./HomePage.module.css";

export default function HomePage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const roles = user?.roles ?? [];
  const [demoView, setDemoView] = useState("dashboard");

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.pageTitle}>Panel</h1>

      <div className={styles.grid}>
        <Card title="Bienvenida" className={styles.gridCard}>
          <p className={styles.lead}>
            Hola, <strong>{user?.full_name}</strong>
          </p>
          <p className="muted">{user?.email}</p>
          <p className="muted">
            Tenant: <code className={styles.mono}>{user?.tenant_id}</code>
          </p>
        </Card>

        <Card title="Tu perfil" className={styles.gridCard}>
          <div className={styles.roleRow} aria-label="Roles asignados">
            {roles.length === 0 ? (
              <span className="muted">Sin roles en la sesión.</span>
            ) : (
              roles.map((role) => (
                <Badge key={role} variant="neutral">
                  {formatRoleLabel(role)}
                </Badge>
              ))
            )}
          </div>
          <RoleGuard roles={["admin_general"]}>
            <p className={`muted ${styles.adminNote}`}>
              Vista adicional sólo para administrador general (demo RoleGuard).
            </p>
          </RoleGuard>
        </Card>

        <Card
          title="Accesos rápidos"
          className={styles.gridCard}
          actions={
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => pushToast("Notificación de ejemplo", "success")}
            >
              Probar toast
            </Button>
          }
        >
          <dl className={styles.quickDl}>
            <div className={styles.quickRow}>
              <dt>Servicios</dt>
              <dd>
                Línea de tiempo y acciones del ciclo — disponible cuando el backend exponga{" "}
                <strong>POC.4</strong> (<code>/services</code>).
              </dd>
            </div>
            <div className={styles.quickRow}>
              <dt>Contratos, sedes y activos</dt>
              <dd>
                La API ya ofrece listados <code>GET</code>; la pantalla de tablas es el siguiente paso
                opcional del plan.
              </dd>
            </div>
            <div className={styles.quickRow}>
              <dt>Reportes y auditoría</dt>
              <dd>Paneles y vistas read-only en fases posteriores del POC.</dd>
            </div>
          </dl>
          <Select
            label="Vista demo (Select)"
            value={demoView}
            onChange={(e) => setDemoView(e.target.value)}
            hint="Componente Select reutilizable; sin navegación aún."
          >
            <option value="dashboard">Panel</option>
            <option value="ops">Operaciones</option>
          </Select>
        </Card>
      </div>
    </div>
  );
}
