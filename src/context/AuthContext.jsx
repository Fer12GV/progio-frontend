import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { apiClient } from "@/api/client.js";
import {
  getStoredRefreshToken,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  setStoredRefreshToken,
  validateRequest,
} from "@/api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState(null);
  const accessRef = useRef(null);

  useEffect(() => {
    accessRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    const id = apiClient.interceptors.request.use((config) => {
      const token = accessRef.current;
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => {
      apiClient.interceptors.request.eject(id);
    };
  }, []);

  const applySession = useCallback((payload) => {
    setAccessToken(payload.access_token);
    setStoredRefreshToken(payload.refresh_token);
    setUser(payload.user);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setStoredRefreshToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedRefresh = getStoredRefreshToken();
      if (!storedRefresh) {
        if (!cancelled) {
          setValidating(false);
        }
        return;
      }
      try {
        const data = await refreshRequest(storedRefresh);
        if (cancelled) {
          return;
        }
        applySession(data);
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setValidating(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  useEffect(() => {
    const id = apiClient.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;
        const status = err.response?.status;
        if (status !== 401 || original._retry || original.url?.includes("/auth/refresh")) {
          return Promise.reject(err);
        }
        original._retry = true;
        const rt = getStoredRefreshToken();
        if (!rt) {
          clearSession();
          return Promise.reject(err);
        }
        try {
          const data = await refreshRequest(rt);
          applySession(data);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return apiClient(original);
        } catch (e) {
          clearSession();
          return Promise.reject(e);
        }
      },
    );
    return () => {
      apiClient.interceptors.response.eject(id);
    };
  }, [applySession, clearSession]);

  const login = useCallback(async ({ email, password, tenant_slug }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginRequest({ email, password, tenant_slug });
      applySession(data);
    } catch (e) {
      const detail = e.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg || d.type).join(" — ")
            : "No se pudo iniciar sesión";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  const logout = useCallback(async () => {
    const token = accessRef.current;
    if (token) {
      try {
        await logoutRequest(token);
      } catch {
        /* best-effort */
      }
    }
    clearSession();
  }, [clearSession]);

  const validate = useCallback(async () => {
    const token = accessRef.current;
    if (!token) {
      return { valid: false };
    }
    return validateRequest(token);
  }, []);

  const refreshMe = useCallback(async () => {
    const token = accessRef.current;
    if (!token) {
      return null;
    }
    return meRequest(token);
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      loading,
      validating,
      error,
      login,
      logout,
      validate,
      refreshMe,
    }),
    [accessToken, user, loading, validating, error, login, logout, validate, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
