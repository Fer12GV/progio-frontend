/** Etiquetas en español para roles del JWT (módulo 2.1 alcance). */
const ROLE_LABELS = {
  admin_general: "Administrador general",
  admin_contrato: "Administrador de contrato",
  coordinador_operaciones: "Coordinador de operaciones",
  supervisor: "Supervisor",
  operario: "Operario",
  interventor: "Interventor",
};

/**
 * @param {string} role
 * @returns {string}
 */
export function formatRoleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}
