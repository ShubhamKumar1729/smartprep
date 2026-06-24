import api from "./api.js";

const fileService = {
  upload: (formData, onProgress) =>
    api.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }).then((r) => r.data),

  getAll: (params) => api.get("/files", { params }).then((r) => r.data),
  getById: (id) => api.get(`/files/${id}`).then((r) => r.data),

  download: async (id, fileName) => {
    const response = await api.get(`/files/download/${id}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  delete: (id) => api.delete(`/files/${id}`).then((r) => r.data),
};

export default fileService;