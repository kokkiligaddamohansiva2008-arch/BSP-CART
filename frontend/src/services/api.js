import { clearSession } from "../utils/session";
import axios from "axios";

/*
| Axios instance shared by all services.
| Change BASE_URL if your backend runs on another port.
| Exported BOTH as default and as a named export, so
|   import api from "./api"       and
|   import { api } from "./api"
| both work.
*/

export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Redirect to login if the token expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem("token") || "";
    const isMockSession = token.startsWith("admin-token-") || token.startsWith("mock-token-");

    // Prototype (mock) sessions are not backend tokens, so a 401 must not log them out.
    if (error.response?.status === 401 && !isMockSession) {
      clearSession();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
