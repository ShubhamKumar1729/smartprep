import api from "./api.js";

const testService = {
  getAll: (params) => api.get("/tests", { params }).then((r) => r.data),
  getById: (id) => api.get(`/tests/${id}`).then((r) => r.data),
  delete: (id) => api.delete(`/tests/${id}`).then((r) => r.data),
  getQuestions: (testId) => api.get(`/tests/questions/${testId}`).then((r) => r.data),
  start: (data) => api.post("/tests/start", data).then((r) => r.data),
  saveAnswer: (data) => api.post("/tests/save-answer", data).then((r) => r.data),
  submit: (data) => api.post("/tests/submit", data).then((r) => r.data),
  getResult: (attemptId) => api.get(`/tests/result/${attemptId}`).then((r) => r.data),
  getHistory: (params) => api.get("/tests/history", { params }).then((r) => r.data),
};

export default testService;