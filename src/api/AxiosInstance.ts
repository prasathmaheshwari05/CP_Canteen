import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  maxRedirects: 0,
});

const logout = () => {
  sessionStorage.removeItem('access_token');
};

const setupInterceptors = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = sessionStorage.getItem('access_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      // Remove trailing slash to avoid FastAPI 404 redirect
      if (config.url && config.url.endsWith('/')) {
        config.url = config.url.slice(0, -1);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const isLoginRoute = window.location.pathname === '/login';

      if (!isLoginRoute && error.response?.status === 401) {
        logout();
        window.location.href = '/login';
      }

      if (!isLoginRoute && error.response?.status === 403) {
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }
  );
};

setupInterceptors(api);

export default api;
