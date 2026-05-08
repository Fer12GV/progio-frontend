import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Card from "@/components/common/Card.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import EventTimeline from "@/components/services/EventTimeline.jsx";
import ServiceActionBar from "@/components/services/ServiceActionBar.jsx";
import { listServiceEvents } from "@/api/events.js";
import { getService } from "@/api/services.js";

import styles from "./ServiceDetailPage.module.css";

function isCanceled(err) {
  return err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

function formatDetail(err) {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg ?? JSON.stringify(x)).join(" — ");
  return err?.message ?? "Error al cargar datos";
}

function normalizeEventList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

function sortEventsAsc(events) {
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

export default function ServiceDetailPage() {
  const { serviceId } = useParams();

  const [service, setService] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  const titleId = useMemo(
    () => `service-detail-${String(serviceId ?? "").replace(/[^a-zA-Z0-9_-]/g, "") || "id"}`,
    [serviceId],
  );

  const reloadDetail = useCallback(async () => {
    if (!serviceId) return;
    try {
      const svc = await getService(serviceId);
      setService(svc);
      let evs = normalizeEventList(svc?.events);
      if (evs.length === 0) {
        try {
          const evData = await listServiceEvents(serviceId);
          evs = normalizeEventList(evData);
        } catch {
          /* timeline opcional */
        }
      }
      setEvents(sortEventsAsc(evs));
    } catch {
      /* el usuario ya ve errores en la carga inicial */
    }
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setApiUnavailable(false);
      setService(null);
      setEvents([]);

      try {
        const svc = await getService(serviceId, { signal: controller.signal });
        if (cancelled) return;

        setService(svc);

        let evs = normalizeEventList(svc?.events);
        if (evs.length === 0) {
          try {
            const evData = await listServiceEvents(serviceId, { signal: controller.signal });
            if (cancelled) return;
            evs = normalizeEventList(evData);
          } catch (e2) {
            if (isCanceled(e2)) return;
            const st = e2?.response?.status;
            if (st !== 404 && st !== 405) {
              /* opcional: ignorar error secundario de timeline */
            }
          }
        }
        if (cancelled) return;
        setEvents(sortEventsAsc(evs));
      } catch (e) {
        if (isCanceled(e)) return;
        const st = e?.response?.status;
        if (st === 404 || st === 405) {
          setApiUnavailable(true);
        } else {
          setError(formatDetail(e));
        }
      } finally {
        if (!cancelled && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [serviceId]);

  return (
    <div className={styles.page}>
      <nav className={styles.backNav} aria-label="Enlace a lista">
        <Link to="/services" className={styles.backLink}>
          ← Volver a servicios
        </Link>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title} id={titleId}>
          Detalle del servicio
        </h1>
        {serviceId ? (
          <p className={styles.subId}>
            ID: <code className={styles.mono}>{serviceId}</code>
          </p>
        ) : null}
      </header>

      {loading ? (
        <div className={styles.loading}>
          <Spinner label="Cargando servicio" />
        </div>
      ) : null}

      {!serviceId ? (
        <p className={styles.bannerError} role="alert">
          Falta el identificador del servicio en la URL.
        </p>
      ) : null}

      {apiUnavailable ? (
        <p className={styles.bannerWarn} role="status">
          No se pudo cargar el detalle (respuesta 404/405). Comprueba el ID del servicio y que el
          backend exponga <code className={styles.mono}>GET /services/{"{id}"}</code> y eventos
          (POC.4).
        </p>
      ) : null}

      {error ? (
        <p className={styles.bannerError} role="alert">
          {error}
        </p>
      ) : null}

      {!loading && service && !apiUnavailable ? (
        <>
          <Card title="Resumen" className={styles.cardMargin}>
            <dl className={styles.dl}>
              <div className={styles.dlRow}>
                <dt>Estado</dt>
                <dd>{service.status ?? service.state ?? "—"}</dd>
              </div>
              <div className={styles.dlRow}>
                <dt>Contrato</dt>
                <dd className={styles.mono}>{String(service.contract_id ?? "—")}</dd>
              </div>
              <div className={styles.dlRow}>
                <dt>Activo</dt>
                <dd className={styles.mono}>{String(service.asset_id ?? "—")}</dd>
              </div>
              {service.site_id != null ? (
                <div className={styles.dlRow}>
                  <dt>Sede</dt>
                  <dd className={styles.mono}>{String(service.site_id)}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card title="Acciones" className={styles.cardMargin}>
            <ServiceActionBar serviceId={serviceId} service={service} onAfterMutation={reloadDetail} />
          </Card>

          <Card title="Eventos" className={styles.cardMargin}>
            <p className={`muted ${styles.hint}`}>
              Los eventos son inmutables; las correcciones se registran como nuevos eventos (p. ej.
              reproceso).
            </p>
            <EventTimeline events={events} aria-label="Eventos del servicio" />
          </Card>
        </>
      ) : null}
    </div>
  );
}
