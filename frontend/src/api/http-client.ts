import axios, { AxiosError, AxiosHeaders } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "/api/v1";

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const requestUrl = config.url ?? "";
  const isAuthRequest =
    requestUrl.includes("/auth/token") ||
    requestUrl.includes("/auth/register");

  if (token === "mock-token-mvp") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } else if (token && !isAuthRequest) {
    const headers = AxiosHeaders.from(
      config.headers ?? {},
    );

    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const token = localStorage.getItem("token");
    const requestUrl = error.config?.url ?? "";
    const isAuthRequest =
      requestUrl.includes("/auth/token") ||
      requestUrl.includes("/auth/register");

    if (error.response?.status === 401 && token && !isAuthRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("maos-a-obra:auth-expired"));
    }

    return Promise.reject(error);
  },
);

export default httpClient;
