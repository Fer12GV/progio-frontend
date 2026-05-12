import { useCallback, useEffect, useRef, useState } from "react";

import { getPrebillByService } from "@/api/prebills.js";
import { formatApiDetail, isCanceledError } from "@/utils/serviceApiHelpers.js";

/**
 * Prefactura asociada a un servicio (`getPrebillByService`).
 *
 * @param {string | undefined} serviceId
 * @param {{ enabled?: boolean }} [options]
 */
export function usePrebillByService(serviceId, options = {}) {
  const { enabled = true } = options;
  const [prebill, setPrebill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchPrebill = useCallback(async () => {
    if (!serviceId || !enabled) {
      setPrebill(null);
      setError(null);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const data = await getPrebillByService(serviceId, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setPrebill(data && typeof data === "object" ? data : null);
    } catch (err) {
      if (isCanceledError(err) || controller.signal.aborted) return;
      setPrebill(null);
      setError(formatApiDetail(err));
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [serviceId, enabled]);

  useEffect(() => {
    void fetchPrebill();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchPrebill]);

  return { prebill, loading, error, refetch: fetchPrebill };
}
