import { apiClient } from "@/api/client.js";
import { getService } from "@/api/services.js";
import { isCanceledError } from "@/utils/serviceApiHelpers.js";

/**
 * @param {Record<string, unknown>} raw
 */
function compactParams(raw) {
  /** @type {Record<string, string | number>} */
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

/**
 * Lista prefacturas (paginado). Filtros opcionales según backend.
 *
 * @param {{
 *   page?: number,
 *   per_page?: number,
 *   service_id?: string,
 *   status?: string,
 * }} [params]
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function listPrebills(params = {}, options = {}) {
  const { page = 1, per_page = 20, service_id, status } = params;
  const { data } = await apiClient.get("/prebills", {
    params: compactParams({ page, per_page, service_id, status }),
    ...options,
  });
  return data;
}

/**
 * Detalle de prefactura por id (`GET /prebills/{id}`).
 *
 * @param {string} prebillId
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function getPrebill(prebillId, options = {}) {
  const { data } = await apiClient.get(`/prebills/${prebillId}`, { ...options });
  return data;
}

/**
 * Prefactura vinculada a un servicio.
 *
 * 1. Si existe **`GET /services/{serviceId}/prebill`** (p. ej. backend POC.5), lo usa.
 * 2. Si responde 404/405, obtiene el servicio (`GET /services/{id}`) y usa objeto embebido `prebill` / `prebill_id` + `GET /prebills/{id}`.
 *
 * @param {string} serviceId
 * @param {import('axios').AxiosRequestConfig} [options]
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getPrebillByService(serviceId, options = {}) {
  if (!serviceId) return null;

  try {
    const { data } = await apiClient.get(`/services/${serviceId}/prebill`, { ...options });
    return data ?? null;
  } catch (err) {
    if (isCanceledError(err)) throw err;
    const st = err?.response?.status;
    if (st !== 404 && st !== 405) throw err;
  }

  const svc = await getService(serviceId, options);
  const embedded = svc?.prebill ?? svc?.pre_bill;
  if (embedded && typeof embedded === "object") {
    return embedded;
  }
  const pid = svc?.prebill_id ?? svc?.prebillId;
  if (!pid) {
    return null;
  }
  return getPrebill(String(pid), options);
}

/**
 * Reintento manual de envío a Siigo (`POST /prebills/{id}/retry-siigo`).
 *
 * @param {string} prebillId
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function retryPrebillSiigo(prebillId, options = {}) {
  const { data } = await apiClient.post(`/prebills/${prebillId}/retry-siigo`, {}, { ...options });
  return data;
}
