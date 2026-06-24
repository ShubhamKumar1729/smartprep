import api from "./api.js";

const smartService = {
  getCollection: () =>
    api.get("/smart/collection").then((r) => r.data),

  getFiles: () =>
    api.get("/smart/files").then((r) => r.data),

  process: (fileIds) =>
    api.post("/smart/process", { fileIds }).then((r) => r.data),

  getSummary: (fileIds, summaryType) =>
    api.post("/smart/summary", { fileIds, summaryType }).then((r) => r.data),

  getNotes: (fileIds, noteType) =>
    api.post("/smart/notes", { fileIds, noteType }).then((r) => r.data),

  getFlashcards: (fileIds) =>
    api.post("/smart/flashcards", { fileIds }).then((r) => r.data),

  createTest: (fileIds, questionType, count, difficulty, title) =>
    api.post("/smart/create-test", {
      fileIds, questionType, count, difficulty, title,
    }).then((r) => r.data),

  uploadFiles: (formData, onProgress) =>
    api.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }).then((r) => r.data),
};

export default smartService;