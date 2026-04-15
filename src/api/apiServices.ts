import api from './AxiosInstance';

const createApiService = (axiosInstance) => ({
  get: (url, params = {}) => axiosInstance.get(url, { params }),
  post: (url, data = {}, config = {}) => axiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => axiosInstance.put(url, data, config),
  delete: (url) => axiosInstance.delete(url),

  handleAxiosError: (error, defaultMessage) => {
    if (error.detail) {
      return error.detail?.message || "Server error occurred";
    }

    if (error.response) {
      if (error.response.data?.detail?.error) {
        return error.response.data.detail.error;
      }
      return error.response.data?.detail || "Server error occurred";
    }

    if (error.request) {
      return "No response from server. Please check your internet connection.";
    }

    if (error.error) {
      return error.error;
    }

    return error.message || defaultMessage || "Something went wrong";
  }
});

export const ApiService = createApiService(api);

export default ApiService;
