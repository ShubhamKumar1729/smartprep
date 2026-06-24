import api from "./api.js";

const authService = {
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  getProfile: () => api.get("/auth/profile").then((r) => r.data),
  updateProfile: (data) => api.put("/auth/profile", data).then((r) => r.data),
  changePassword: (data) => api.put("/auth/change-password", data).then((r) => r.data),
};

export default authService;