import { apiClient } from "@/api/client.js";

/**
 * Lista activos del tenant (paginado + filtros opcionales).
 * @param {{
 *   page?: number,
 *   per_page?: number,
 *   contract_id?: string,
 *   vehicle_type?: string,
 *   fuel_type?: string,
 * }} [params]
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function listAssets(params = {}, options = {}) {
  const { page = 1, per_page = 20, contract_id, vehicle_type, fuel_type } = params;
  const { data } = await apiClient.get("/assets", {
    params: {
      page,
      per_page,
      ...(contract_id !== undefined ? { contract_id } : {}),
      ...(vehicle_type !== undefined ? { vehicle_type } : {}),
      ...(fuel_type !== undefined ? { fuel_type } : {}),
    },
    ...options,
  });
  return data;
}
