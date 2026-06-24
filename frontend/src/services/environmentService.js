import api from "./api.js";

const environmentService = {
  save: (data) => api.post("/environment/save", data).then((r) => r.data),
  get: (testId) => api.get(`/environment/${testId}`).then((r) => r.data),
};

export default environmentService;