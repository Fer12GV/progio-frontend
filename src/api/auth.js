import { apiClient } from "@/api/client.js";

const REFRESH_STORAGE_KEY = "progio_refresh_token_v1";

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_STORAGE_KEY);
}

export function setStoredRefreshToken(token) {
  if (token) {
    localStorage.setItem(REFRESH_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_STORAGE_KEY);
  }
}

export async function loginRequest({ email, password, tenant_slug }) {
  const body = { email, password };
  if (tenant_slug) {
    body.tenant_slug = tenant_slug;
  }
  const { data } = await apiClient.post("/auth/login", body);
  return data;
}

export async function refreshRequest(refreshToken) {
  const { data } = await apiClient.post("/auth/refresh", { refresh_token: refreshToken });
  return data;
}

export async function meRequest(accessToken) {
  const { data } = await apiClient.get("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function validateRequest(accessToken) {
  const { data } = await apiClient.get("/auth/validate", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export async function logoutRequest(accessToken) {
  await apiClient.post(
    "/auth/logout",
    {},
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
}

export { REFRESH_STORAGE_KEY };
