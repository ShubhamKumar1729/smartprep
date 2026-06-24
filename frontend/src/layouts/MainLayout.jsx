import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";

const navItems = [
  { path: "/home", label: "Home", emoji: "🏠" },
  { path: "/my-files", label: "My Files", emoji: "📄" },
  { path: "/my-tests", label: "My Tests", emoji: "📋" },
  { path: "/history", label: "History", emoji: "📊" },
  { path: "/analytics", label: "Analytics", emoji: "📈" },
  { path: "/planner", label: "Study Planner", emoji: "📅" },
  { path: "/achievements", label: "Achievements", emoji: "🏆" },
  { path: "/profile", label: "Profile", emoji: "👤" },
];

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    success("Logged out successfully");
    navigate("/login");
  };

  const SidebarContent = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "white",
        borderRight: "1px solid #f1f5f9",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.25rem 1rem",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 10px rgba(99,102,241,0.25)",
            }}
          >
            <span style={{ color: "white", fontWeight: 800, fontSize: 16 }}>
              S
            </span>
          </div>
          <div>
            <p
              style={{
                fontWeight: 800,
                color: "#0f172a",
                fontSize: 15,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              SmartPrep
            </p>
            <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
              AI Learning Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        {navItems.map(({ path, label, emoji }, index) => (
          <motion.div
            key={path}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
          >
            <NavLink
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "sidebar-item-active" : ""}`
              }
            >
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span>{label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
        {/* User Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0.625rem 0.875rem",
            borderRadius: 10,
            backgroundColor: "#f8fafc",
            marginBottom: 6,
            cursor: "pointer",
          }}
          onClick={() => navigate("/profile")}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              className="line-clamp-1"
              style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}
            >
              {user?.name}
            </p>
            <p
              className="line-clamp-1"
              style={{ fontSize: 10, color: "#94a3b8" }}
            >
              {user?.email}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="sidebar-item"
          style={{ color: "#ef4444" }}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#f8fafc",
        overflow: "hidden",
      }}
    >
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15,23,42,0.5)",
              zIndex: 40,
              backdropFilter: "blur(4px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className="sidebar-desktop"
        style={{ width: 220, flexShrink: 0, display: "none" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -260 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 220,
          zIndex: 50,
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        }}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "#f1f5f9",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            color: "#64748b",
            zIndex: 1,
            width: 28,
            height: 28,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
        <SidebarContent />
      </motion.aside>

      {/* Main */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Mobile Header */}
        <header
          className="mobile-header"
          style={{
            backgroundColor: "white",
            borderBottom: "1px solid #f1f5f9",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(true)}
            style={{
              padding: "0.5rem",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "#64748b",
            }}
          >
            ☰
          </motion.button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontWeight: 800, fontSize: 12 }}>
                S
              </span>
            </div>
            <span
              style={{
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              SmartPrep
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
          }}
        >
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .sidebar-desktop { display: block !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;