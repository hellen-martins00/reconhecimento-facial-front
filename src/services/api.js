import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  baseURL: "http://127.0.0.1:8000",
});

// ENVIAR TOKEN
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// TRATAR RESPOSTA
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    if (status === 401 && !url.includes("/login")) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("usuario");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;