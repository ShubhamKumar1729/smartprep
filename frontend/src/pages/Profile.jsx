import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";
import authService from "../services/authService.js";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { formatDate } from "../utils/formatters.js";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [nameError, setNameError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passErrors, setPassErrors] = useState({});
  const [passLoading, setPassLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [stats, setStats] = useState({
    totalTests: 0,
    totalFiles: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    authService
      .getProfile()
      .then((res) => {
        setStats(res.data.stats || { totalTests: 0, totalFiles: 0 });
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setNameError("Name is required"); return; }
    if (name.trim().length < 2) { setNameError("Min 2 characters"); return; }

    setProfileLoading(true);
    try {
      const res = await authService.updateProfile({ name: name.trim() });
      updateUser(res.data.user);
      success("Profile updated successfully! ✓");
      setNameError("");
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const validatePasswords = () => {
    const e = {};
    if (!passwords.currentPassword) e.currentPassword = "Required";
    if (!passwords.newPassword) e.newPassword = "Required";
    else if (passwords.newPassword.length < 8) e.newPassword = "Min 8 characters";
    if (!passwords.confirmPassword) e.confirmPassword = "Required";
    else if (passwords.newPassword !== passwords.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setPassErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    setPassLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });
      success("Password changed successfully! 🔒");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPassErrors({});
    } catch (err) {
      toastError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPassLoading(false);
    }
  };

  const togglePassword = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          My Profile
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          Manage your account settings and preferences
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        {/* Avatar + Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
            paddingBottom: 20,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 8px 20px rgba(99,102,241,0.25)",
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h2
              style={{
                fontWeight: 800,
                color: "#0f172a",
                fontSize: 18,
                letterSpacing: "-0.01em",
                marginBottom: 4,
              }}
            >
              {user?.name}
            </h2>
            <p style={{ color: "#64748b", fontSize: 13 }}>{user?.email}</p>
            <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
              Member since {formatDate(user?.createdAt)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {[
            {
              label: "Files Uploaded",
              value: stats.totalFiles,
              emoji: "📄",
              color: "#6366f1",
              bg: "#eef2ff",
            },
            {
              label: "Tests Taken",
              value: stats.totalTests,
              emoji: "📋",
              color: "#16a34a",
              bg: "#f0fdf4",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: stat.bg,
                borderRadius: 12,
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.emoji}</div>
              {statsLoading ? (
                <div
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: stat.color,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {stat.value}
                </p>
              )}
              <p
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Update Name */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card"
      >
        <h3
          style={{
            fontWeight: 700,
            color: "#0f172a",
            fontSize: 15,
            marginBottom: 16,
          }}
        >
          Update Profile
        </h3>
        <form
          onSubmit={handleProfileSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <Input
            label="Full Name"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            error={nameError}
            required
            placeholder="Your full name"
          />

          {/* Email (read-only) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}
            >
              Email Address
            </label>
            <input
              value={user?.email}
              disabled
              className="form-input"
              style={{ color: "#94a3b8" }}
            />
            <p style={{ fontSize: 11, color: "#94a3b8" }}>
              Email address cannot be changed
            </p>
          </div>

          <Button type="submit" loading={profileLoading}>
            Save Changes
          </Button>
        </form>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3
          style={{
            fontWeight: 700,
            color: "#0f172a",
            fontSize: 15,
            marginBottom: 16,
          }}
        >
          Change Password
        </h3>
        <form
          onSubmit={handlePasswordSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {[
            { key: "current", field: "currentPassword", label: "Current Password" },
            { key: "new", field: "newPassword", label: "New Password" },
            { key: "confirm", field: "confirmPassword", label: "Confirm New Password" },
          ].map(({ key, field, label }) => (
            <div
              key={field}
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <label
                style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}
              >
                {label} <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name={field}
                  type={showPasswords[key] ? "text" : "password"}
                  value={passwords[field]}
                  onChange={(e) => {
                    setPasswords((p) => ({
                      ...p,
                      [field]: e.target.value,
                    }));
                    if (passErrors[field]) {
                      setPassErrors((p) => ({ ...p, [field]: "" }));
                    }
                  }}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  className={`form-input ${
                    passErrors[field] ? "form-input-error" : ""
                  }`}
                  style={{ paddingRight: 48 }}
                  autoComplete={
                    key === "current"
                      ? "current-password"
                      : "new-password"
                  }
                />
                <button
                  type="button"
                  onClick={() => togglePassword(key)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    color: "#94a3b8",
                    padding: 0,
                  }}
                >
                  {showPasswords[key] ? "🙈" : "👁️"}
                </button>
              </div>
              {passErrors[field] && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: 12,
                    display: "flex",
                    gap: 4,
                  }}
                >
                  <span>⚠</span> {passErrors[field]}
                </p>
              )}
            </div>
          ))}

          <Button
            type="submit"
            loading={passLoading}
            variant="secondary"
          >
            🔒 Change Password
          </Button>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="card"
        style={{ backgroundColor: "#f8fafc" }}
      >
        <h3
          style={{
            fontWeight: 700,
            color: "#0f172a",
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          Account Information
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Account ID", value: user?._id },
            { label: "Created", value: formatDate(user?.createdAt) },
            { label: "Status", value: "Active ✓" },
          ].map((info) => (
            <div
              key={info.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <span style={{ fontSize: 13, color: "#64748b" }}>
                {info.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color:
                    info.label === "Status" ? "#16a34a" : "#0f172a",
                  fontFamily:
                    info.label === "Account ID" ? "monospace" : "inherit",
                  fontSize: info.label === "Account ID" ? 11 : 13,
                }}
              >
                {info.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;