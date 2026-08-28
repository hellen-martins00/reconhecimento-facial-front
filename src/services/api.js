import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  // https://reconhecimento-facial-api-production.up.railway.app
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
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // ==================================================
    // TOKEN INVÁLIDO / EXPIRADO
    // NÃO aplicar no login.
    // ==================================================
    if (status === 401 && !url.includes("/login")) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("usuario");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;