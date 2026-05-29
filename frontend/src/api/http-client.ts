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

  if (token === "mock-token-mvp") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } else if (token) {
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
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(error);
  },
);

export default httpClient;
