import styles from "./EventTimeline.module.css";

/**
 * Lista cronológica de eventos del servicio (inmutables — sin editar/borrar).
 *
 * @param {{
 *   events: unknown[],
 *   "aria-label"?: string,
 * }} props
 */
export default function EventTimeline({ events, "aria-label": ariaLabel = "Línea de tiempo del servicio" }) {
  const list = Array.isArray(events) ? events : [];

  if (list.length === 0) {
    return (
      <p className={`muted ${styles.empty}`} role="status">
        No hay eventos registrados para este servicio.
      </p>
    );
  }

  return (
    <ol className={styles.list} aria-label={ariaLabel}>
      {list.map((ev, index) => (
        <EventItem key={eventKey(ev, index)} event={ev} />
      ))}
    </ol>
  );
}

function eventKey(ev, index) {
  if (ev && typeof ev === "object" && ev.id != null) return String(ev.id);
  return `ev-${index}`;
}

function formatWhen(raw) {
  if (raw == null) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "medium" });
}

function payloadSummary(ev) {
  if (!ev || typeof ev !== "object") return null;
  const p = ev.payload;
  if (p == null) return null;
  if (typeof p === "string") return p;
  try {
    return JSON.stringify(p, null, 2);
  } catch {
    return String(p);
  }
}

function EventItem({ event: ev }) {
  const type = ev?.event_type ?? ev?.type ?? "evento";
  const when = formatWhen(ev?.created_at ?? ev?.timestamp ?? ev?.captured_at);
  const userId = ev?.user_id ?? ev?.userId;
  const role = ev?.role_at_event ?? ev?.role;
  const reproceso = String(type).toLowerCase().includes("reproceso") || type === "reproceso";
  const reason =
    ev?.payload && typeof ev.payload === "object" && ev.payload.reason != null
      ? String(ev.payload.reason)
      : null;
  const detail = payloadSummary(ev);
  const showPayload = Boolean(detail);

  return (
    <li className={styles.item}>
      <div className={styles.marker} aria-hidden />
      <div className={styles.card}>
        <div className={styles.head}>
          <span className={styles.type}>{String(type)}</span>
          <time className={styles.when} dateTime={ev?.created_at ?? undefined}>
            {when}
          </time>
        </div>
        <dl className={styles.meta}>
          {userId != null ? (
            <div className={styles.metaRow}>
              <dt>Usuario</dt>
              <dd className={styles.mono}>{String(userId)}</dd>
            </div>
          ) : null}
          {role ? (
            <div className={styles.metaRow}>
              <dt>Rol</dt>
              <dd>{String(role)}</dd>
            </div>
          ) : null}
          {reproceso && reason ? (
            <div className={styles.metaRow}>
              <dt>Motivo</dt>
              <dd className={styles.reason}>{reason}</dd>
            </div>
          ) : null}
        </dl>
        {showPayload ? (
          <pre className={styles.payload} tabIndex={0}>
            {detail}
          </pre>
        ) : null}
      </div>
    </li>
  );
}
