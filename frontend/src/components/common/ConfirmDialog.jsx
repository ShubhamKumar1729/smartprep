import React from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            backgroundColor: danger ? "#fef2f2" : "#fef3c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
          }}
        >
          {danger ? "🗑️" : "⚠️"}
        </div>

        <p
          style={{
            color: "#4b5563",
            fontSize: 14,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            fullWidth
          >
            {cancelText}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            fullWidth
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;