import { apiClient } from "@/api/client.js";

/**
 * Eventos inmutables de un servicio (read-only).
 * @param {string} serviceId
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function listServiceEvents(serviceId, options = {}) {
  const { data } = await apiClient.get(`/services/${serviceId}/events`, { ...options });
  return data;
}

/**
 * Sincronización offline: envía lote con `client_event_id` (idempotencia en servidor).
 * @param {string} serviceId
 * @param {{ events: Array<{ client_event_id: string, event_type: string, payload?: unknown, captured_at: string }> }} body
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function syncServiceEvents(serviceId, body, options = {}) {
  const { data } = await apiClient.post(`/services/${serviceId}/events/sync`, body, { ...options });
  return data;
}
