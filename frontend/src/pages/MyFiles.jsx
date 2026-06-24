import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import smartService from "../services/smartService.js";
import fileService from "../services/fileService.js";
import useToast from "../hooks/useToast.js";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import {
  formatFileSize,
  formatDate,
  getFileTypeLabel,
  getFileBadgeClass,
  getFileEmoji,
  getRelativeTime,
} from "../utils/formatters.js";

const actionButtons = [
  { label: "Summary", action: "summary", emoji: "📖" },
  { label: "Notes", action: "notes", emoji: "📝" },
  { label: "Flashcards", action: "flashcards", emoji: "🎴" },
  { label: "Test Me", action: "test", emoji: "🧠" },
];

const MyFiles = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("-uploadedAt");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteFile, setDeleteFile] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await smartService.getFiles();
      setFiles(res.data.files || []);
    } catch {
      toastError("Failed to load files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await fileService.delete(deleteFile._id);
      success("File deleted successfully");
      setDeleteFile(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteFile._id));
      loadFiles();
    } catch {
      toastError("Failed to delete file");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      await fileService.download(file._id, file.originalName);
      success("Download started!");
    } catch {
      toastError("Download failed");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredFiles = files
    .filter((f) => {
      const matchesSearch = f.originalName
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const matchesType =
        filterType === "all" ||
        (filterType === "pdf" && f.fileType?.includes("pdf")) ||
        (filterType === "pptx" && f.fileType?.includes("presentation")) ||
        (filterType === "docx" && f.fileType?.includes("wordprocessing"));
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sort === "-uploadedAt") return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      if (sort === "uploadedAt") return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      if (sort === "originalName") return a.originalName.localeCompare(b.originalName);
      if (sort === "fileSize") return b.fileSize - a.fileSize;
      return 0;
    });

  const allSelected =
    filteredFiles.length > 0 &&
    selectedIds.length === filteredFiles.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            My Files
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            {files.length} file{files.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {selectedIds.length > 0 && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="btn-primary"
              onClick={() =>
                navigate("/learn/summary", { state: { fileIds: selectedIds } })
              }
              style={{ fontSize: 13 }}
            >
              ✨ Use Selected ({selectedIds.length})
            </motion.button>
          )}
          <button
            onClick={() => navigate("/home")}
            className="btn-secondary"
            style={{ fontSize: 13 }}
          >
            + Upload More
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="form-input"
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Type Filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { value: "all", label: "All" },
            { value: "pdf", label: "PDF" },
            { value: "pptx", label: "PPTX" },
            { value: "docx", label: "DOCX" },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: `1.5px solid ${filterType === type.value ? "#6366f1" : "#e2e8f0"}`,
                backgroundColor: filterType === type.value ? "#eef2ff" : "white",
                color: filterType === type.value ? "#4338ca" : "#64748b",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="form-input"
          style={{ width: "auto", fontSize: 13 }}
        >
          <option value="-uploadedAt">Newest First</option>
          <option value="uploadedAt">Oldest First</option>
          <option value="originalName">Name A-Z</option>
          <option value="fileSize">Largest First</option>
        </select>

        <button
          onClick={() =>
            allSelected
              ? setSelectedIds([])
              : setSelectedIds(filteredFiles.map((f) => f._id))
          }
          className="btn-ghost"
          style={{ fontSize: 12 }}
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </motion.div>

      {/* Files */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
            {search || filterType !== "all" ? "No files match your filters" : "No files yet"}
          </h3>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            {search || filterType !== "all"
              ? "Try different search terms"
              : "Upload files from the home page"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredFiles.map((file, index) => {
            const isSelected = selectedIds.includes(file._id);
            return (
              <motion.div
                key={file._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  backgroundColor: isSelected ? "#eef2ff" : "white",
                  border: `1.5px solid ${isSelected ? "#6366f1" : "#f1f5f9"}`,
                  borderRadius: 14,
                  transition: "all 0.15s",
                }}
              >
                {/* Checkbox */}
                <div
                  onClick={() => toggleSelect(file._id)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: `2px solid ${isSelected ? "#6366f1" : "#e2e8f0"}`,
                    backgroundColor: isSelected ? "#6366f1" : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {isSelected && (
                    <span style={{ color: "white", fontSize: 11, fontWeight: 800 }}>
                      ✓
                    </span>
                  )}
                </div>

                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: "#f8fafc",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {getFileEmoji(file.fileType)}
                </div>

                {/* Info */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    className="line-clamp-1"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#0f172a",
                      marginBottom: 4,
                    }}
                  >
                    {file.originalName}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span className={getFileBadgeClass(file.fileType)}>
                      {getFileTypeLabel(file.fileType)}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      {formatFileSize(file.fileSize)}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      {getRelativeTime(file.uploadedAt)}
                    </span>
                    {file.isProcessed && (
                      <span
                        style={{
                          backgroundColor: "#f0fdf4",
                          color: "#16a34a",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "1px 8px",
                          borderRadius: 999,
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        ✓ AI Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleDownload(file)}
                    style={{
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1.5px solid #e2e8f0",
                      background: "white",
                      cursor: "pointer",
                      fontSize: 15,
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.backgroundColor = "#eef2ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                    title="Download"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => setDeleteFile(file)}
                    style={{
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1.5px solid #fecaca",
                      background: "#fef2f2",
                      cursor: "pointer",
                      fontSize: 15,
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#ef4444";
                      e.currentTarget.style.backgroundColor = "#fee2e2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#fecaca";
                      e.currentTarget.style.backgroundColor = "#fef2f2";
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ position: "sticky", bottom: 16, zIndex: 50 }}
          >
            <div
              style={{
                backgroundColor: "#0f172a",
                borderRadius: 18,
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                border: "1px solid #1e293b",
              }}
            >
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 600,
                  fontSize: 13,
                  flex: 1,
                }}
              >
                {selectedIds.length} file{selectedIds.length > 1 ? "s" : ""} selected
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {actionButtons.map((btn) => (
                  <button
                    key={btn.action}
                    onClick={() =>
                      navigate(`/learn/${btn.action}`, {
                        state: { fileIds: selectedIds },
                      })
                    }
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.15)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "inherit",
                    }}
                  >
                    {btn.emoji} {btn.label}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedIds([])}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "transparent",
                    color: "rgba(255,255,255,0.4)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    fontFamily: "inherit",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteFile}
        onClose={() => setDeleteFile(null)}
        onConfirm={handleDelete}
        title="Delete File"
        message={`Delete "${deleteFile?.originalName}"? This action cannot be undone.`}
        confirmText="Delete File"
        danger
        loading={deleteLoading}
      />
    </div>
  );
};

export default MyFiles;