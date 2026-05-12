import { useMemo } from "react";

import Spinner from "@/components/common/Spinner.jsx";
import { useCanSeeFinance } from "@/hooks/useCanSeeFinance.js";
import {
  formatMoney,
  normalizePrebillItems,
  prebillCurrency,
  prebillLineDescription,
  prebillLineQuantity,
  prebillLineTotal,
  prebillLineUnitPrice,
  prebillTotalAmount,
} from "@/utils/prebillDisplay.js";

import styles from "./PrebillView.module.css";

/**
 * @param {Record<string, unknown> | null | undefined} prebill
 */
function statusClass(status) {
  const s = String(status ?? "").toLowerCase();
  if (s === "draft" || s === "borrador") return styles.statusDraft;
  if (s === "valid" || s === "válida" || s === "valida") return styles.statusValid;
  if (s === "sent" || s === "enviada") return styles.statusSent;
  if (s === "confirmed" || s === "confirmada") return styles.statusConfirmed;
  if (s === "failed" || s === "error") return styles.statusFailed;
  return "";
}

/**
 * @param {Record<string, unknown> | null | undefined} prebill
 * @param {Record<string, unknown> | null | undefined} service
 */
function resolveClientLabel(prebill, service) {
  const p = prebill && typeof prebill === "object" ? prebill : null;
  const s = service && typeof service === "object" ? service : null;
  const fromP = p?.client_name ?? p?.customer_name ?? p?.cliente ?? p?.customer?.name;
  if (typeof fromP === "string" && fromP.trim()) return fromP.trim();
  const fromS = s?.client_name ?? s?.customer_name ?? s?.cliente;
  if (typeof fromS === "string" && fromS.trim()) return fromS.trim();
  return "—";
}

/**
 * @param {Record<string, unknown> | null | undefined} prebill
 * @param {Record<string, unknown> | null | undefined} service
 */
function resolveAssetLabel(prebill, service) {
  const p = prebill && typeof prebill === "object" ? prebill : null;
  const s = service && typeof service === "object" ? service : null;
  const nested = p?.asset && typeof p.asset === "object" ? p.asset : null;
  const fromP =
    p?.asset_label ??
    p?.asset_name ??
    nested?.license_plate ??
    nested?.plate ??
    nested?.name ??
    nested?.identifier;
  if (typeof fromP === "string" && fromP.trim()) return fromP.trim();
  const aid = s?.asset_id ?? p?.asset_id;
  if (aid != null && String(aid).trim()) return String(aid);
  return "—";
}

/**
 * @param {{
 *   prebill: Record<string, unknown> | null,
 *   service?: Record<string, unknown> | null,
 *   loading?: boolean,
 *   error?: string | null,
 *   className?: string,
 * }} props
 */
export default function PrebillView({ prebill, service = null, loading = false, error = null, className = "" }) {
  const canSeeMoney = useCanSeeFinance();

  const currency = useMemo(() => prebillCurrency(prebill), [prebill]);
  const items = useMemo(() => normalizePrebillItems(prebill), [prebill]);
  const total = useMemo(() => prebillTotalAmount(prebill), [prebill]);
  const status = prebill?.status ?? prebill?.state ?? "—";
  const clientLabel = useMemo(() => resolveClientLabel(prebill, service), [prebill, service]);
  const assetLabel = useMemo(() => resolveAssetLabel(prebill, service), [prebill, service]);

  if (loading) {
    return (
      <div className={`${styles.wrap} ${className}`.trim()}>
        <div className={styles.loading}>
          <Spinner label="Cargando prefactura" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.wrap} ${className}`.trim()}>
        <p className={styles.error} role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!prebill) {
    return (
      <div className={`${styles.wrap} ${className}`.trim()}>
        <p className={styles.muted}>No hay prefactura asociada a este servicio.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.wrap} ${className}`.trim()}>
      <div className={styles.meta}>
        <span className={`${styles.status} ${statusClass(status)}`.trim()}>{String(status)}</span>
      </div>

      <dl className={styles.dl}>
        <div className={styles.dlRow}>
          <dt>Cliente</dt>
          <dd>{clientLabel}</dd>
        </div>
        <div className={styles.dlRow}>
          <dt>Activo</dt>
          <dd className={styles.mono}>{assetLabel}</dd>
        </div>
      </dl>

      {items.length === 0 ? (
        <p className={styles.muted}>Sin líneas de detalle en la respuesta.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Concepto</th>
                <th scope="col" className={styles.num}>
                  Cant.
                </th>
                {canSeeMoney ? (
                  <>
                    <th scope="col" className={styles.num}>
                      P. unit.
                    </th>
                    <th scope="col" className={styles.num}>
                      Subtotal
                    </th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {items.map((line, idx) => {
                const key = String(line?.id ?? line?.line_id ?? idx);
                const desc = prebillLineDescription(line);
                const qty = prebillLineQuantity(line);
                const unit = prebillLineUnitPrice(line);
                const sub = prebillLineTotal(line);
                return (
                  <tr key={key}>
                    <td>{desc}</td>
                    <td className={styles.num}>{qty != null ? qty : "—"}</td>
                    {canSeeMoney ? (
                      <>
                        <td className={styles.num}>{unit != null ? formatMoney(unit, currency) : "—"}</td>
                        <td className={styles.num}>{sub != null ? formatMoney(sub, currency) : "—"}</td>
                      </>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
            {canSeeMoney && total != null ? (
              <tfoot>
                <tr className={styles.totalRow}>
                  <td colSpan={canSeeMoney ? 3 : 1}>Total</td>
                  <td className={styles.num}>{formatMoney(total, currency)}</td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      )}

      {!canSeeMoney && items.length > 0 ? (
        <p className={styles.muted}>Los importes no se muestran en tu perfil.</p>
      ) : null}
    </div>
  );
}
