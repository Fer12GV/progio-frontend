import { useCallback, useEffect, useRef, useState } from "react";

import { listServiceEvents } from "@/api/events.js";
import {
  formatApiDetail,
  isCanceledError,
  normalizeEventList,
  sortEventsAsc,
} from "@/utils/serviceApiHelpers.js";

/**
 * Eventos del servicio vía `GET /services/{id}/events` (read-only).
 * Usar con `enabled: false` cuando el detalle ya trae `service.events`.
 *
 * @param {string | undefined} serviceId
 * @param {{ enabled?: boolean }} [options]
 */
export function useEvents(serviceId, options = {}) {
  const { enabled = true } = options;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  const refetch = useCallback(async () => {
    if (!serviceId || !enabled) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await listServiceEvents(serviceId, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setEvents(sortEventsAsc(normalizeEventList(data)));
    } catch (e) {
      if (isCanceledError(e)) return;
      const st = e?.response?.status;
      if (st === 404 || st === 405) {
        setEvents([]);
      } else {
        setError(formatApiDetail(e));
        setEvents([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [serviceId, enabled]);

  useEffect(() => {
    if (!serviceId || !enabled) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return undefined;
    }
    void refetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [serviceId, enabled, refetch]);

  return { events, loading, error, refetch };
}
