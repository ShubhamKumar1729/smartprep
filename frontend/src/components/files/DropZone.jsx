import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.ms-powerpoint",
];

const MAX_SIZE = 50 * 1024 * 1024;

const DropZone = ({ onFilesSelected, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);

  const validateFiles = (files) => {
    const valid = [];
    const errs = [];

    Array.from(files).forEach((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        errs.push(`${f.name}: Invalid type`);
      } else if (f.size > MAX_SIZE) {
        errs.push(`${f.name}: Exceeds 50MB`);
      } else {
        valid.push(f);
      }
    });

    setErrors(errs);
    return valid;
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const valid = validateFiles(e.dataTransfer.files);
      if (valid.length > 0) onFilesSelected(valid);
    },
    [disabled, onFilesSelected]
  );

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleInput = useCallback(
    (e) => {
      const valid = validateFiles(e.target.files);
      if (valid.length > 0) onFilesSelected(valid);
      e.target.value = "";
    },
    [onFilesSelected]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        animate={{
          borderColor: isDragOver ? "#6366f1" : "#e2e8f0",
          backgroundColor: isDragOver ? "#eef2ff" : "white",
          scale: isDragOver ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        style={{
          border: "2px dashed #e2e8f0",
          borderRadius: 16,
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.pptx,.docx,.doc,.ppt"
          onChange={handleInput}
          style={{ display: "none" }}
          disabled={disabled}
        />

        <motion.div
          animate={{ y: isDragOver ? -4 : 0 }}
          style={{
            width: 60,
            height: 60,
            backgroundColor: isDragOver ? "#e0e7ff" : "#f1f5f9",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 26,
            transition: "all 0.2s",
          }}
        >
          {isDragOver ? "✨" : "📂"}
        </motion.div>

        <p
          style={{
            fontWeight: 700,
            color: isDragOver ? "#4338ca" : "#374151",
            fontSize: 15,
            marginBottom: 6,
          }}
        >
          {isDragOver ? "Drop your files!" : "Drag & drop files here"}
        </p>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 14 }}>
          or click to browse files
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <span className="badge badge-pdf">PDF</span>
          <span className="badge badge-pptx">PPTX</span>
          <span className="badge badge-docx">DOCX</span>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 8 }}>
          Max 50MB per file · Up to 10 files
        </p>
      </motion.div>

      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: 12,
            }}
          >
            {errors.map((err, i) => (
              <p
                key={i}
                style={{
                  color: "#dc2626",
                  fontSize: 12,
                  display: "flex",
                  gap: 6,
                }}
              >
                ⚠️ {err}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DropZone;