import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";
import authService from "../services/authService.js";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Name is required";
    else if (formData.name.trim().length < 2) e.name = "Min 2 characters";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Invalid email";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 8) e.password = "Min 8 characters";
    if (!formData.confirmPassword) e.confirmPassword = "Please confirm password";
    else if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.register(formData);
      login(res.data.user, res.data.token);
      success("Account created! Welcome to SmartPrep 🎉");
      navigate("/home", { replace: true });
    } catch (err) {
      toastError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return null;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[@$!%*?&]/.test(p)) s++;
    if (s <= 2) return { label: "Weak", color: "#ef4444", width: "30%" };
    if (s === 3) return { label: "Fair", color: "#f59e0b", width: "55%" };
    if (s === 4) return { label: "Good", color: "#6366f1", width: "75%" };
    return { label: "Strong", color: "#16a34a", width: "100%" };
  };

  const strength = getPasswordStrength();

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: 20,
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
        padding: "2rem",
        border: "1px solid #f1f5f9",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          Create your account
        </h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Start learning smarter with AI assistance
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="John Doe"
          error={errors.name}
          required
          autoComplete="name"
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={errors.email}
          required
          autoComplete="email"
        />

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Password <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className={`form-input ${errors.password ? "form-input-error" : ""}`}
              style={{ paddingRight: 48 }}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
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
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Strength bar */}
          {strength && formData.password && (
            <div>
              <div
                style={{
                  height: 4,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <motion.div
                  animate={{ width: strength.width }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: "100%",
                    backgroundColor: strength.color,
                    borderRadius: 99,
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: 11,
                  marginTop: 4,
                  color: strength.color,
                  fontWeight: 600,
                }}
              >
                Password strength: {strength.label}
              </p>
            </div>
          )}
          {errors.password && (
            <p style={{ color: "#ef4444", fontSize: 12, display: "flex", gap: 4 }}>
              <span>⚠</span> {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            Confirm Password <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            className={`form-input ${errors.confirmPassword ? "form-input-error" : ""}`}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p style={{ color: "#ef4444", fontSize: 12, display: "flex", gap: 4 }}>
              <span>⚠</span> {errors.confirmPassword}
            </p>
          )}
        </div>

        <Button
          type="submit"
          loading={loading}
          fullWidth
          style={{ marginTop: 4 }}
        >
          Create Account →
        </Button>
      </form>

      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "#64748b",
          marginTop: 20,
        }}
      >
        Already have an account?{" "}
        <Link
          to="/login"
          style={{
            color: "#6366f1",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;