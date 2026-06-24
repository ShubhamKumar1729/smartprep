import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontWeight: 800, fontSize: 24 }}>S</span>
        </div>
        <LoadingSpinner size="md" />
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;