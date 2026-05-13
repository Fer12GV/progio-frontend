/**
 * Valores de query `status` en GET /api/v1/services (coinciden con `ServiceStatus` del backend).
 */
export const SERVICE_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "en_espera", label: "En espera" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "reprocesado", label: "Reprocesado" },
  { value: "bloqueado", label: "Bloqueado" },
];

/** Subconjunto usado en el panel del operario. */
export const OPERATOR_PANEL_STATUS_FILTER_OPTIONS = SERVICE_STATUS_FILTER_OPTIONS.filter(
  (o) =>
    o.value === "" ||
    ["pendiente", "en_proceso", "en_espera", "finalizado"].includes(o.value),
);
