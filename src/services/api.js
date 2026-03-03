// Using global axios from script tag in index.html
const axios = window.axios;

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Compatibility helper used across the app.
// Returns request methods that force a specific bearer token.
api.withToken = (token) => {
  const withAuthHeader = (config = {}) => ({
    ...config,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    get: (url, config) => api.get(url, withAuthHeader(config)),
    post: (url, data, config) => api.post(url, data, withAuthHeader(config)),
    put: (url, data, config) => api.put(url, data, withAuthHeader(config)),
    patch: (url, data, config) => api.patch(url, data, withAuthHeader(config)),
    delete: (url, config) => api.delete(url, withAuthHeader(config)),
  };
};

export default api;
