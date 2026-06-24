import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const maxWidths = { sm: 400, md: 500, lg: 620, xl: 760 };
  const maxWidth = maxWidths[size] || 500;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.5)",
              backdropFilter: "blur(4px)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "relative",
              backgroundColor: "white",
              borderRadius: 20,
              boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
              width: "100%",
              maxWidth,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #f1f5f9",
                position: "sticky",
                top: 0,
                backgroundColor: "white",
                zIndex: 1,
                borderRadius: "20px 20px 0 0",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  border: "none",
                  background: "#f1f5f9",
                  cursor: "pointer",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  fontSize: 18,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e2e8f0";
                  e.currentTarget.style.color = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "1.5rem" }}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;