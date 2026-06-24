export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getRelativeTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

export const formatTime = (seconds) => {
  if (!seconds) return "0m 0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export const formatDuration = (minutes) => {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export const getFileTypeLabel = (mimeType) => {
  const map = {
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "application/msword": "DOC",
    "application/vnd.ms-powerpoint": "PPT",
  };
  return map[mimeType] || "FILE";
};

export const getFileBadgeClass = (mimeType) => {
  const map = {
    "application/pdf": "badge-pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "badge-pptx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "badge-docx",
    "application/msword": "badge-docx",
    "application/vnd.ms-powerpoint": "badge-pptx",
  };
  return `badge ${map[mimeType] || "badge-pdf"}`;
};

export const getFileEmoji = (mimeType) => {
  if (mimeType?.includes("pdf")) return "📕";
  if (mimeType?.includes("presentation")) return "📊";
  return "📝";
};

export const truncate = (str, length = 40) => {
  if (!str) return "";
  return str.length > length ? str.substring(0, length) + "..." : str;
};

export const getGradeColor = (percentage) => {
  if (percentage >= 90) return { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (percentage >= 80) return { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
  if (percentage >= 70) return { color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" };
  if (percentage >= 60) return { color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  if (percentage >= 50) return { color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" };
  return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
};

export const getGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
};