import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL) throw new Error("VITE_API_BASE_URL is not defined in .env");

const api = axios.create({
  baseURL,
  maxRedirects: 0,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

const logout = () => {
  sessionStorage.removeItem("access_token");
};

const setupInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = sessionStorage.getItem("access_token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      // Remove trailing slash to avoid FastAPI 404 redirect
      if (config.url && config.url.endsWith("/")) {
        config.url = config.url.slice(0, -1);
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const isLoginRoute = window.location.pathname === "/login";

      if (!isLoginRoute && error.response?.status === 401) {
        logout();
        window.location.href = "/login";
      }

      if (!isLoginRoute && error.response?.status === 403) {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }
  );
};

setupInterceptors(api);

export default api;
