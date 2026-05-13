import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Card from "@/components/common/Card.jsx";
import Select from "@/components/common/Select.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import Button from "@/components/common/Button.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import { useServices } from "@/hooks/useServices.js";
import { OPERATOR_PANEL_STATUS_FILTER_OPTIONS } from "@/constants/serviceStatusFilter.js";
import { getServiceOperatorId } from "@/utils/serviceApiHelpers.js";

import styles from "./OperatorPanelPage.module.css";

const PER_PAGE = 50;

const ASSIGNMENT_OPTIONS = [
  { value: "mine", label: "Sólo asignados a mí" },
  { value: "all", label: "Todos (lista reciente)" },
];

/**
 * Panel del operario — lista corta de servicios con filtros mínimos (POC.6.1).
 * Ruta protegida con `RoleGuard` en `App.jsx` (rol `operario`).
 */
export default function OperatorPanelPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const [assignment, setAssignment] = useState("mine");

  const userId = useMemo(() => {
    if (!user || typeof user !== "object") return null;
    const v = user.id ?? user.user_id ?? user.sub;
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s || null;
  }, [user]);

  const { items, loading, error, unavailable, refetch } = useServices({
    page: 1,
    perPage: PER_PAGE,
    status,
    contractId: "",
    assetId: "",
  });

  const rows = useMemo(() => {
    if (assignment !== "mine" || !userId) return items;
    return items.filter((row) => getServiceOperatorId(row) === userId);
  }, [items, assignment, userId]);

  const showNoUserIdHint = assignment === "mine" && !userId;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Panel del operario</h1>
      <p className={`muted ${styles.lead}`}>
        Servicios recientes del tenant. Filtra por estado y por asignación. Abre un servicio para
        ver acciones (inicio, pausa, insumos, cierre).
      </p>

      {showNoUserIdHint ? (
        <p className={styles.bannerWarn} role="status">
          No se detectó tu identificador de usuario en la sesión; mostrando la lista completa hasta
          que el backend incluya <code className={styles.mono}>id</code> en <code>/auth/me</code>.
        </p>
      ) : null}

      <Card title="Filtros" className={styles.cardMargin}>
        <div className={styles.filters}>
          <Select
            label="Estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
            }}
            className={styles.filterField}
          >
            {OPERATOR_PANEL_STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            label="Asignación"
            value={assignment}
            onChange={(e) => setAssignment(e.target.value)}
            className={styles.filterField}
            hint="«Sólo asignados a mí» usa operator_id u homólogos en la respuesta; si faltan, la lista puede quedar vacía."
          >
            {ASSIGNMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card
        title="Mis servicios"
        className={styles.cardMargin}
        actions={
          <Button variant="ghost" size="sm" type="button" onClick={() => void refetch()}>
            Actualizar
          </Button>
        }
      >
        {unavailable ? (
          <p className={styles.bannerWarn} role="status">
            El endpoint <code className={styles.mono}>GET /services</code> no está disponible aún
            (backend POC.4).
          </p>
        ) : null}
        {error ? (
          <p className={styles.bannerError} role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className={styles.loading}>
            <Spinner label="Cargando servicios" />
          </div>
        ) : (
          <>
            {assignment === "mine" && items.length > 0 && rows.length === 0 && userId ? (
              <p className={`muted ${styles.hint}`} role="status">
                Ninguno de los servicios de esta página tiene tu usuario como operador asignado.
                Prueba «Todos» o pide asignación desde coordinación. Si el API no devuelve aún{" "}
                <code className={styles.mono}>operator_id</code>, habrá que completar el contrato
                del listado o detalle en la API.
              </p>
            ) : null}
            {rows.length === 0 && !unavailable ? (
              <p className={styles.empty}>No hay servicios para mostrar con estos filtros.</p>
            ) : (
              <div className={styles.list}>
                {rows.map((row, idx) => {
                  const id = String(row.id ?? "");
                  const st = row.status ?? row.state ?? "—";
                  return (
                    <Link key={id || `row-${idx}`} to={`/services/${id}`} className={styles.row}>
                      <div className={styles.rowTop}>
                        <span className={styles.status}>{String(st)}</span>
                        <span className={styles.chev} aria-hidden>
                          →
                        </span>
                      </div>
                      <p className={styles.mono}>ID: {id || "—"}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
