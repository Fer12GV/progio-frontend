import { apiClient } from "@/api/client.js";

/**
 * Lista usuarios del tenant (paginado). Requiere ruta `GET /users` en backend.
 *
 * @param {{
 *   page?: number,
 *   per_page?: number,
 *   search?: string,
 *   role?: string,
 *   is_active?: boolean,
 * }} [params]
 * @param {import('axios').AxiosRequestConfig} [options]
 */
export async function listUsers(params = {}, options = {}) {
  const { page = 1, per_page = 50, search, role, is_active } = params;
  const q = { page, per_page };
  if (search != null && search !== "") q.search = search;
  if (role != null && role !== "") q.role = role;
  if (is_active != null) q.is_active = is_active;

  const { data } = await apiClient.get("/users", { params: q, ...options });
  return data;
}
