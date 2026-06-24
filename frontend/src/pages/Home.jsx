import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";
import smartService from "../services/smartService.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import {
  formatFileSize,
  formatDate,
  getFileTypeLabel,
  getFileBadgeClass,
  getFileEmoji,
  getRelativeTime,
} from "../utils/formatters.js";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.ms-powerpoint",
];

const actionButtons = [
  { label: "Summary", action: "summary", emoji: "📖", color: "#6366f1", bg: "#eef2ff" },
  { label: "Notes", action: "notes", emoji: "📝", color: "#16a34a", bg: "#f0fdf4" },
  { label: "Flashcards", action: "flashcards", emoji: "🎴", color: "#8b5cf6", bg: "#faf5ff" },
  { label: "Test Me", action: "test", emoji: "🧠", color: "#d97706", bg: "#fffbeb" },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [defaultCollection, setDefaultCollection] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingFiles(true);
    try {
      const [colRes, filesRes] = await Promise.all([
        smartService.getCollection(),
        smartService.getFiles(),
      ]);
      setDefaultCollection(colRes.data.collection);
      setFiles(filesRes.data.files || []);
    } catch {
      toastError("Failed to load files");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleUpload = async (filesToUpload) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    const invalid = Array.from(filesToUpload).filter(
      (f) => !ALLOWED_TYPES.includes(f.type)
    );
    if (invalid.length > 0) {
      toastError("Only PDF, PPTX, and DOCX files are allowed");
      return;
    }

    let collectionId = defaultCollection?._id;
    if (!collectionId) {
      try {
        const res = await smartService.getCollection();
        setDefaultCollection(res.data.collection);
        collectionId = res.data.collection._id;
      } catch {
        toastError("Failed to get collection");
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("collectionId", collectionId);
    Array.from(filesToUpload).forEach((f) => formData.append("files", f));

    try {
      await smartService.uploadFiles(formData, setUploadProgress);
      success(`${filesToUpload.length} file(s) uploaded successfully! 🎉`);
      await loadData();
    } catch (err) {
      toastError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const toggleSelect = (fileId) => {
    setSelectedIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFiles.map((f) => f._id));
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const filteredFiles = files.filter((f) =>
    f.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allSelected =
    filteredFiles.length > 0 &&
    selectedIds.length === filteredFiles.length;

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* ── Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #8b5cf6 100%)",
          borderRadius: 20,
          padding: "1.75rem 2rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 220,
            height: 220,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: 80,
            width: 160,
            height: 160,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: 13,
              opacity: 0.75,
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            {getGreeting()} 👋
          </p>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              marginBottom: 8,
              letterSpacing: "-0.03em",
            }}
          >
            {user?.name?.split(" ")[0]}
          </h1>
          <p style={{ opacity: 0.7, fontSize: 14 }}>
            Upload study materials and get instant AI-powered summaries,
            notes, flashcards, and tests.
          </p>
        </div>
      </motion.div>

      {/* ── Upload Zone ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragOver ? "#6366f1" : "#e2e8f0"}`,
            borderRadius: 18,
            padding: "2rem",
            textAlign: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            backgroundColor: isDragOver ? "#eef2ff" : "white",
            transition: "all 0.2s ease",
            transform: isDragOver ? "scale(1.01)" : "scale(1)",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.pptx,.docx,.doc,.ppt"
            style={{ display: "none" }}
            disabled={uploading}
            onChange={(e) => handleUpload(e.target.files)}
          />

          {uploading ? (
            <div>
              <LoadingSpinner size="lg" />
              <p
                style={{
                  marginTop: 14,
                  fontWeight: 700,
                  color: "#374151",
                  fontSize: 15,
                }}
              >
                Uploading files... {uploadProgress}%
              </p>
              <div
                style={{
                  height: 6,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginTop: 12,
                  maxWidth: 300,
                  margin: "12px auto 0",
                }}
              >
                <motion.div
                  animate={{ width: `${uploadProgress}%` }}
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              <motion.div
                animate={{ y: isDragOver ? -4 : 0 }}
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: isDragOver ? "#e0e7ff" : "#f1f5f9",
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: 28,
                }}
              >
                {isDragOver ? "✨" : "📂"}
              </motion.div>
              <p
                style={{
                  fontWeight: 700,
                  color: isDragOver ? "#4338ca" : "#374151",
                  fontSize: 16,
                  marginBottom: 6,
                }}
              >
                {isDragOver ? "Drop files here!" : "Drag & drop your files"}
              </p>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                or click to browse · PDF, PPTX, DOCX supported
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span className="badge badge-pdf">PDF</span>
                <span className="badge badge-pptx">PPTX</span>
                <span className="badge badge-docx">DOCX</span>
              </div>
              <p
                style={{
                  color: "#cbd5e1",
                  fontSize: 11,
                  marginTop: 10,
                }}
              >
                Max 50MB per file · Up to 10 files at once
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Files Section ── */}
      {loadingFiles ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : files.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card"
          style={{ textAlign: "center", padding: "3rem" }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ fontSize: 56, marginBottom: 16 }}
          >
            📚
          </motion.div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#374151",
              marginBottom: 8,
            }}
          >
            No files uploaded yet
          </h3>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Upload your first PDF, PPTX, or DOCX to get started
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Files Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.01em",
                }}
              >
                My Files
              </h2>
              <span
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: 999,
                }}
              >
                {files.length}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Search */}
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    fontSize: 14,
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="form-input"
                  style={{
                    paddingLeft: 32,
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    fontSize: 13,
                    width: 180,
                  }}
                />
              </div>

              <button
                onClick={selectAll}
                className="btn-ghost"
                style={{ fontSize: 12 }}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
          </div>

          {/* File List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AnimatePresence>
              {filteredFiles.map((file, index) => {
                const isSelected = selectedIds.includes(file._id);
                return (
                  <motion.div
                    key={file._id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => toggleSelect(file._id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      backgroundColor: isSelected ? "#eef2ff" : "white",
                      border: `1.5px solid ${isSelected ? "#6366f1" : "#f1f5f9"}`,
                      borderRadius: 14,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    whileHover={{ boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
                  >
                    {/* Checkbox */}
                    <motion.div
                      animate={{
                        backgroundColor: isSelected ? "#6366f1" : "white",
                        borderColor: isSelected ? "#6366f1" : "#e2e8f0",
                      }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: "2px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{
                            color: "white",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.div>

                    {/* File Icon */}
                    <div
                      style={{
                        width: 42,
                        height: 42,
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
                            ✓ Ready
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Floating Action Bar ── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: "sticky",
              bottom: 16,
              zIndex: 50,
            }}
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
                  minWidth: 140,
                }}
              >
                {selectedIds.length} file
                {selectedIds.length > 1 ? "s" : ""} selected
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {actionButtons.map((btn) => (
                  <motion.button
                    key={btn.action}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
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
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "inherit",
                    }}
                  >
                    {btn.emoji} {btn.label}
                  </motion.button>
                ))}

                <button
                  onClick={() => setSelectedIds([])}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    backgroundColor: "transparent",
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
    </div>
  );
};

export default Home;