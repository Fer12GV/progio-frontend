/**
 * @param {Record<string, unknown> | null | undefined} raw
 */
function normalizePrebillStatusKey(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Prefactura efectiva: la del hook o la embebida en `service` (GET detalle).
 *
 * @param {Record<string, unknown> | null | undefined} prebill
 * @param {Record<string, unknown> | null | undefined} service
 */
function resolveEffectivePrebill(prebill, service) {
  if (prebill && typeof prebill === "object") return prebill;
  const emb = service?.prebill ?? service?.pre_bill;
  if (emb && typeof emb === "object") return emb;
  return null;
}

/**
 * ¿Hay enlace explícito a prefactura en el servicio?
 *
 * @param {Record<string, unknown> | null | undefined} service
 */
function hasPrebillLink(service) {
  if (!service || typeof service !== "object") return false;
  const pid = service.prebill_id ?? service.prebillId;
  return pid != null && String(pid).trim() !== "";
}

/**
 * Resultado para bloquear el botón Cerrar y mostrar guía (POC.5.3).
 *
 * @param {Record<string, unknown> | null | undefined} prebill
 * @param {Record<string, unknown> | null | undefined} service
 * @param {{ prebillLoading?: boolean, prebillError?: string | null }} [meta]
 * @returns {{ blocked: boolean, kind: 'ok'|'loading'|'error'|'missing'|'wrong_status', summary: string, detail: string }}
 */
export function describePrebillCloseBlock(prebill, service, meta = {}) {
  const prebillLoading = Boolean(meta.prebillLoading);
  const errRaw = meta.prebillError;
  const prebillError =
    typeof errRaw === "string" && errRaw.trim() ? errRaw.trim() : errRaw != null ? String(errRaw) : null;

  if (prebillLoading) {
    return {
      blocked: true,
      kind: "loading",
      summary: "Comprobando prefactura…",
      detail:
        "Espera a que termine la carga de la tarjeta Prefactura (arriba). Para cerrar, la prefactura debe constar en estado valid (válida).",
    };
  }

  if (prebillError) {
    return {
      blocked: true,
      kind: "error",
      summary: "No se pudo verificar la prefactura",
      detail: `${prebillError} Revisa la conexión o vuelve a cargar la página. Sin confirmar la prefactura no se puede cerrar desde la interfaz.`,
    };
  }

  const bill = resolveEffectivePrebill(prebill, service);
  const linked = Boolean(bill) || hasPrebillLink(service);

  if (!bill && !linked) {
    return {
      blocked: true,
      kind: "missing",
      summary: "No hay prefactura lista para cerrar",
      detail:
        "Debe existir una prefactura asociada a este servicio y figurar en estado válido (valid). Genera o valida la prefactura desde administración o contabilidad y vuelve a esta página. Consulta la tarjeta Prefactura más arriba.",
    };
  }

  if (!bill && linked) {
    return {
      blocked: true,
      kind: "missing",
      summary: "No se obtuvo el detalle de la prefactura",
      detail:
        "El servicio indica una prefactura vinculada, pero no hay datos para validar el estado. Revisa la tarjeta Prefactura o los permisos; el cierre seguirá bloqueado hasta confirmar estado válido.",
    };
  }

  const stKey = normalizePrebillStatusKey(bill?.status ?? bill?.state);
  if (stKey === "valid") {
    return { blocked: false, kind: "ok", summary: "", detail: "" };
  }

  const label = String(bill?.status ?? bill?.state ?? "—");
  return {
    blocked: true,
    kind: "wrong_status",
    summary: "La prefactura no está en estado válido",
    detail: `Estado actual: «${label}». Para cerrar el servicio la prefactura debe estar en estado válido (valid). Revisa la tarjeta Prefactura más arriba o contacta a administración.`,
  };
}
