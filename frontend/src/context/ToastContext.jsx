import React, { createContext, useCallback } from "react";
import toast from "react-hot-toast";

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const success = useCallback((msg) => toast.success(msg), []);
  const error = useCallback((msg) => toast.error(msg), []);
  const info = useCallback((msg) => toast(msg, { icon: "ℹ️" }), []);
  const warning = useCallback(
    (msg) => toast(msg, { icon: "⚠️", style: { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" } }),
    []
  );
  const loading = useCallback((msg) => toast.loading(msg), []);
  const dismiss = useCallback((id) => toast.dismiss(id), []);

  return (
    <ToastContext.Provider value={{ success, error, info, warning, loading, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
};