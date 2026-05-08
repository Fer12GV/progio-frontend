import { apiClient } from "@/api/client.js";

/**
 * Lista contratos del tenant (paginado).
 * @param {{ page?: number, per_page?: number }} [params]
 * @param {import('axios').AxiosRequestConfig} [options] — p. ej. `{ signal }` para AbortController
 * @returns {Promise<{ items: unknown[], total: number, page: number, per_page: number }>}
 */
export async function listContracts(params = {}, options = {}) {
  const { data } = await apiClient.get("/contracts", {
    params: {
      page: params.page ?? 1,
      per_page: params.per_page ?? 20,
    },
    ...options,
  });
  return data;
}
