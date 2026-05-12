import { useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import Card from "@/components/common/Card.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import PrebillView from "@/components/prebill/PrebillView.jsx";
import EventTimeline from "@/components/services/EventTimeline.jsx";
import ServiceActionBar from "@/components/services/ServiceActionBar.jsx";
import { useEvents } from "@/hooks/useEvents.js";
import { usePrebillByService } from "@/hooks/usePrebillByService.js";
import { useService } from "@/hooks/useService.js";
import { normalizeEventList, sortEventsAsc } from "@/utils/serviceApiHelpers.js";

import styles from "./ServiceDetailPage.module.css";

export default function ServiceDetailPage() {
  const { serviceId } = useParams();

  const { service, loading, error, unavailable: apiUnavailable, refetch: refetchService } = useService(serviceId);

  const embeddedEvents = useMemo(
    () => sortEventsAsc(normalizeEventList(service?.events)),
    [service],
  );

  const fetchEventsSeparately = Boolean(
    serviceId && service && !apiUnavailable && embeddedEvents.length === 0,
  );

  const {
    events: fetchedEvents,
    loading: eventsLoading,
    refetch: refetchEvents,
  } = useEvents(serviceId, { enabled: fetchEventsSeparately });

  const prebillEnabled = Boolean(serviceId && service && !apiUnavailable);
  const {
    prebill,
    loading: prebillLoading,
    error: prebillError,
    refetch: refetchPrebill,
  } = usePrebillByService(serviceId, { enabled: prebillEnabled });

  const events = fetchEventsSeparately ? fetchedEvents : embeddedEvents;
  const displayLoading = loading || (fetchEventsSeparately && eventsLoading);

  const titleId = useMemo(
    () => `service-detail-${String(serviceId ?? "").replace(/[^a-zA-Z0-9_-]/g, "") || "id"}`,
    [serviceId],
  );

  const reloadDetail = useCallback(async () => {
    await Promise.all([refetchService(), refetchEvents(), refetchPrebill()]);
  }, [refetchService, refetchEvents, refetchPrebill]);

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

      {displayLoading ? (
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

      {!displayLoading && service && !apiUnavailable ? (
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

          <Card title="Prefactura" className={styles.cardMargin}>
            <PrebillView
              prebill={prebill}
              service={service}
              loading={prebillLoading}
              error={prebillError}
            />
          </Card>

          <Card title="Acciones" className={styles.cardMargin}>
            <ServiceActionBar
              serviceId={serviceId}
              service={service}
              prebill={prebill}
              prebillLoading={prebillLoading}
              prebillError={prebillError}
              onAfterMutation={reloadDetail}
            />
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
