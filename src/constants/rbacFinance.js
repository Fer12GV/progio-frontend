/**
 * Roles que pueden ver importes, precios unitarios, subtotales y payloads de eventos con datos
 * económicos. `operario` no está incluido (defensa en profundidad; alinear con backend RBAC).
 *
 * @type {readonly string[]}
 */
export const FINANCE_VISIBLE_ROLES = Object.freeze([
  "admin_general",
  "admin_contrato",
  "coordinador_operaciones",
  "supervisor",
  "interventor",
]);
