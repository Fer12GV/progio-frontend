import { useCallback, useEffect, useRef, useState } from "react";

import { listServices } from "@/api/services.js";
import { formatApiDetail, isCanceledError } from "@/utils/serviceApiHelpers.js";

/**
 * Lista paginada de servicios con cancelación al cambiar filtros o al desmontar.
 *
 * @param {{
 *   page: number,
 *   perPage?: number,
 *   status?: string,
 *   contractId?: string,
 *   assetId?: string,
 * }} params
 */
export function useServices(params) {
  const { page, perPage = 20, status = "", contractId = "", assetId = "" } = params;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  const abortRef = useRef(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setUnavailable(false);

    try {
      const q = { page, per_page: perPage };
      if (status) q.status = status;
      if (contractId) q.contract_id = contractId;
      if (assetId) q.asset_id = assetId;

      const data = await listServices(q, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (err) {
      if (isCanceledError(err)) return;
      const httpStatus = err?.response?.status;
      if (httpStatus === 404 || httpStatus === 405) {
        setUnavailable(true);
        setItems([]);
        setTotal(0);
        return;
      }
      setError(formatApiDetail(err));
      setItems([]);
      setTotal(0);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [page, perPage, status, contractId, assetId]);

  useEffect(() => {
    void refetch();
    return () => {
      abortRef.current?.abort();
    };
  }, [refetch]);

  return { items, total, loading, error, unavailable, refetch };
}
