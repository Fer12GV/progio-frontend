import axios from "axios";

const rawBase = import.meta.env.VITE_API_BASE_URL;
const rawPrefix = import.meta.env.VITE_API_PREFIX;

if (typeof rawBase !== "string" || !rawBase.trim()) {
  throw new Error("Falta VITE_API_BASE_URL en .env (ver .env.example).");
}
if (typeof rawPrefix !== "string" || !rawPrefix.trim()) {
  throw new Error("Falta VITE_API_PREFIX en .env (ver .env.example).");
}

const baseURL = `${rawBase.replace(/\/$/, "")}${rawPrefix.startsWith("/") ? rawPrefix : `/${rawPrefix}`}`;

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});
