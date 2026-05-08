import { apiClient } from "@/api/client.js";

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
 * Lista servicios (filtros opcionales según API).
 * Requiere backend POC.4 (`GET /services`).
 * @param {{
 *   page?: number,
 *   per_page?: number,
 *   status?: string,
 *   asset_id?: string,
 *   contract_id?: string,
 *   site_id?: string,
 *   date_from?: string,
 *   date_to?: string,
 * }} [params]
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function listServices(params = {}, options = {}) {
  const { page = 1, per_page = 20, status, asset_id, contract_id, site_id, date_from, date_to } =
    params;
  const { data } = await apiClient.get("/services", {
    params: compactParams({
      page,
      per_page,
      status,
      asset_id,
      contract_id,
      site_id,
      date_from,
      date_to,
    }),
    ...options,
  });
  return data;
}

/**
 * Crea servicio en estado Pendiente.
 * @param {Record<string, unknown>} body
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function createService(body, options = {}) {
  const { data } = await apiClient.post("/services", body, { ...options });
  return data;
}

/**
 * Detalle de servicio (puede incluir `events` y `prebill` según backend).
 * @param {string} serviceId
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function getService(serviceId, options = {}) {
  const { data } = await apiClient.get(`/services/${serviceId}`, { ...options });
  return data;
}

/**
 * @param {string} serviceId
 * @param {Record<string, unknown>} body
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function assignOperator(serviceId, body, options = {}) {
  const { data } = await apiClient.post(`/services/${serviceId}/assign`, body, { ...options });
  return data;
}

export async function startService(serviceId, options = {}) {
  const { data } = await apiClient.post(`/services/${serviceId}/start`, {}, { ...options });
  return data;
}

export async function pauseService(serviceId, body = {}, options = {}) {
  const { data } = await apiClient.post(`/services/${serviceId}/pause`, body, { ...options });
  return data;
}

export async function resumeService(serviceId, options = {}) {
  const { data } = await apiClient.post(`/services/${serviceId}/resume`, {}, { ...options });
  return data;
}

export async function registerInputs(serviceId, body, options = {}) {
  const { data } = await apiClient.post(`/services/${serviceId}/inputs`, body, { ...options });
  return data;
}

export async function superviseService(serviceId, body, options = {}) {
  const { data } = await apiClient.post(`/services/${serviceId}/supervise`, body, { ...options });
  return data;
}

export async function closeService(serviceId, options = {}) {
  const { data } = await apiClient.post(`/services/${serviceId}/close`, {}, { ...options });
  return data;
}

export async function cancelService(serviceId, body = {}, options = {}) {
  const { data } = await apiClient.post(`/services/${serviceId}/cancel`, body, { ...options });
  return data;
}

/**
 * @param {string} serviceId
 * @param {{ reason: string }} body
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function reprocessService(serviceId, body, options = {}) {
  const { data } = await apiClient.post(`/services/${serviceId}/reprocess`, body, { ...options });
  return data;
}
