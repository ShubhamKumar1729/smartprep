import api from "./api.js";

const proctoringService = {
  start: (data) => api.post("/proctoring/start", data).then((r) => r.data),
  event: (data) => api.post("/proctoring/event", data).then((r) => r.data),
  end: (data) => api.post("/proctoring/end", data).then((r) => r.data),
  report: (attemptId) => api.get(`/proctoring/report/${attemptId}`).then((r) => r.data),
};

export default proctoringService;