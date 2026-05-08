/**
 * Normaliza el estado operativo del servicio para la máquina de estados en UI.
 * Acepta variantes en español / snake_case según backend POC.4.
 *
 * @param {{ status?: string, state?: string } | null | undefined} service
 * @returns {'pending'|'in_progress'|'on_hold'|'done'|'cancelled'|'reprocessed'|'blocked'|'unknown'}
 */
export function getCanonicalServiceStatus(service) {
  const raw = service?.status ?? service?.state ?? "";
  const folded = String(raw)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/pendiente/.test(folded)) return "pending";
  if (/en\s*proceso|en_proceso/.test(folded)) return "in_progress";
  if (/en\s*espera|en_espera/.test(folded)) return "on_hold";
  if (/finalizado/.test(folded)) return "done";
  if (/cancelado/.test(folded)) return "cancelled";
  if (/reprocesado/.test(folded)) return "reprocessed";
  if (/bloqueado/.test(folded)) return "blocked";

  return "unknown";
}
