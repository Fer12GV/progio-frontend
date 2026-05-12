/** @param {unknown} err */
export function isCanceledError(err) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

/** @param {unknown} err */
export function formatApiDetail(err) {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg ?? JSON.stringify(x)).join(" — ");
  return err?.message ?? "Error al cargar datos";
}

/**
 * Operador asignado al servicio (variantes típicas de API POC / futuro).
 *
 * @param {unknown} service
 * @returns {string | null}
 */
export function getServiceOperatorId(service) {
  if (!service || typeof service !== "object") return null;
  const s = service;
  const v =
    s.operator_id ??
    s.assigned_operator_id ??
    s.operatorId ??
    s.assigned_user_id ??
    s.operator?.id ??
    s.assigned_operator?.id;
  if (v === undefined || v === null) return null;
  const str = String(v).trim();
  return str || null;
}

/** @param {unknown} raw */
export function normalizeEventList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

/** @param {unknown[]} events */
export function sortEventsAsc(events) {
  const list = [...events];
  list.sort((a, b) => {
    const ta = Date.parse(a?.created_at ?? a?.timestamp ?? a?.captured_at ?? 0);
    const tb = Date.parse(b?.created_at ?? b?.timestamp ?? b?.captured_at ?? 0);
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return ta - tb;
  });
  return list;
}
