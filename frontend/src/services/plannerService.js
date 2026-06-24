import api from "./api.js";

const plannerService = {
  generate: (params) => api.get("/planner/generate", { params }).then((r) => r.data),
  getAll: () => api.get("/planner").then((r) => r.data),
};

export default plannerService;