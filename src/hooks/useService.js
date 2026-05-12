import { useCallback, useEffect, useRef, useState } from "react";

import { getService } from "@/api/services.js";
import { formatApiDetail, isCanceledError } from "@/utils/serviceApiHelpers.js";

/**
 * Detalle de un servicio (`GET /services/{id}`) con `AbortController`.
 *
 * @param {string | undefined} serviceId
 */
export function useService(serviceId) {
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(Boolean(serviceId));
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  const abortRef = useRef(null);

  const refetch = useCallback(async () => {
    if (!serviceId) {
      setService(null);
      setLoading(false);
      setError(null);
      setUnavailable(false);
      return null;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setUnavailable(false);
    setService(null);

    try {
      const data = await getService(serviceId, { signal: controller.signal });
      if (controller.signal.aborted) return null;
      setService(data);
      return data;
    } catch (e) {
      if (isCanceledError(e)) return null;
      const st = e?.response?.status;
      if (st === 404 || st === 405) {
        setUnavailable(true);
      } else {
        setError(formatApiDetail(e));
      }
      return null;
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      setService(null);
      setError(null);
      setUnavailable(false);
      return undefined;
    }
    void refetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [serviceId, refetch]);

  return { service, loading, error, unavailable, refetch };
}
