import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
});

api.interceptors.request.use(
  (config) => {
    const vohUser = JSON.parse(localStorage.getItem("voh_user") || "{}");
    const token = localStorage.getItem("token") || vohUser.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
};

export const contactsAPI = {
  getAll: () => api.get("/contacts"),
  add: (data) => api.post("/contacts", data),
  delete: (id) => api.delete(`/contacts/${id}`),
};

export const sosAPI = {
  send: (data) => api.post("/sos/send", data),
  getHistory: () => api.get("/sos/history"),
  updateStatus: (id, status) => api.patch(`/sos/${id}/status`, { status }),
  updateEvidence: (id, evidenceUrl) =>
    api.patch(`/sos/${id}/evidence`, { evidenceUrl }),
  deleteAlert: (id) => api.delete(`/sos/${id}`),
  clearAll: () => api.delete("/sos/clear-all"),
  deleteResolved: () => api.delete("/sos/resolved"),
  acknowledge: (id) => api.patch(`/sos/${id}/acknowledge`),
  getUnacknowledged: () => api.get("/sos/unacknowledged"),
};

export const adminAPI = {
  getUsers: () => api.get("/admin/users"),
  updateUserRole: (id, role) =>
    api.patch(`/admin/users/${id}/role`, { role }),
};

export const pushAPI = {
  subscribe: (subscription) => api.post("/push/subscribe", { subscription }),
  unsubscribe: (endpoint) => api.post("/push/unsubscribe", { endpoint }),
  registerFcm: (token) => api.post("/push/register-fcm", { token }),
};

export default api;
