import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import useAuth from "../hooks/useAuth.js";

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0f9ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorations */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(99,102,241,0.06))",
        }}
      />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
              }}
            >
              <span style={{ color: "white", fontWeight: 800, fontSize: 22 }}>S</span>
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.03em",
              }}
            >
              SmartPrep
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            AI-Powered Learning Platform
          </p>
        </motion.div>

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;