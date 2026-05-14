import api from './AxiosInstance';
import { AxiosInstance, AxiosRequestConfig } from 'axios';

const createApiService = (axiosInstance: AxiosInstance) => ({
  get: (url: string, params: Record<string, unknown> = {}) => axiosInstance.get(url, { params }),
  post: (url: string, data: unknown = {}, config: AxiosRequestConfig = {}) => axiosInstance.post(url, data, config),
  put: (url: string, data: unknown = {}, config: AxiosRequestConfig = {}) => axiosInstance.put(url, data, config),
  delete: (url: string) => axiosInstance.delete(url),

  handleAxiosError: (error: unknown, defaultMessage?: string): string => {
    const err = error as {
      detail?: { message?: string };
      response?: { data?: { detail?: { error?: string } | string } };
      request?: unknown;
      error?: string;
      message?: string;
    };

    if (err.detail) {
      return err.detail?.message || "Server error occurred";
    }

    if (err.response) {
      const detail = err.response.data?.detail;
      if (detail && typeof detail === 'object' && 'error' in detail) {
        return (detail as { error: string }).error;
      }
      return (typeof detail === 'string' ? detail : null) || "Server error occurred";
    }

    if (err.request) {
      return "No response from server. Please check your internet connection.";
    }

    if (err.error) {
      return err.error;
    }

    return err.message || defaultMessage || "Something went wrong";
  }
});

export const ApiService = createApiService(api);

export default ApiService;
