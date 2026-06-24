import api from "./api.js";

const analyticsService = {
  dashboard: () => api.get("/analytics/dashboard").then((r) => r.data),
  topics: () => api.get("/analytics/topics").then((r) => r.data),
  readiness: () => api.get("/analytics/readiness").then((r) => r.data),
};

export default analyticsService;