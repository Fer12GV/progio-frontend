/**
 * Normaliza líneas de prefactura desde distintas formas de API (POC / futuro).
 *
 * @param {Record<string, unknown> | null | undefined} prebill
 * @returns {Record<string, unknown>[]}
 */
export function normalizePrebillItems(prebill) {
  if (!prebill || typeof prebill !== "object") return [];
  const raw = prebill.items ?? prebill.lines ?? prebill.line_items;
  return Array.isArray(raw) ? raw : [];
}

/**
 * @param {Record<string, unknown> | null | undefined} prebill
 * @returns {string | null}
 */
export function prebillCurrency(prebill) {
  if (!prebill || typeof prebill !== "object") return null;
  const c = prebill.currency ?? prebill.currency_code;
  return typeof c === "string" && c.trim() ? c.trim().toUpperCase() : "COP";
}

/**
 * @param {Record<string, unknown> | null | undefined} prebill
 * @returns {number | null}
 */
export function prebillTotalAmount(prebill) {
  if (!prebill || typeof prebill !== "object") return null;
  const raw = prebill.total ?? prebill.amount_total ?? prebill.grand_total ?? prebill.total_amount;
  if (raw === undefined || raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {number | null | undefined} amount
 * @param {string} [currency]
 */
export function formatMoney(amount, currency = "COP") {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) {
    return "—";
  }
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency.length === 3 ? currency : "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return String(amount);
  }
}

/**
 * @param {Record<string, unknown>} line
 * @returns {string}
 */
export function prebillLineDescription(line) {
  if (!line || typeof line !== "object") return "—";
  const d =
    line.description ??
    line.concept ??
    line.name ??
    line.item_name ??
    line.product_name ??
    line.title;
  return typeof d === "string" && d.trim() ? d.trim() : "—";
}

/**
 * @param {Record<string, unknown>} line
 * @returns {number | null}
 */
export function prebillLineQuantity(line) {
  if (!line || typeof line !== "object") return null;
  const raw = line.quantity ?? line.qty ?? line.units;
  if (raw === undefined || raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown>} line
 * @returns {number | null}
 */
export function prebillLineUnitPrice(line) {
  if (!line || typeof line !== "object") return null;
  const raw = line.unit_price ?? line.precio_unitario ?? line.price_unit ?? line.unit_amount;
  if (raw === undefined || raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown>} line
 * @returns {number | null}
 */
export function prebillLineTotal(line) {
  if (!line || typeof line !== "object") return null;
  const raw =
    line.line_total ?? line.total_line ?? line.amount ?? line.subtotal ?? line.total ?? line.importe;
  if (raw !== undefined && raw !== null) {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  const q = prebillLineQuantity(line);
  const u = prebillLineUnitPrice(line);
  if (q != null && u != null) return q * u;
  return null;
}
