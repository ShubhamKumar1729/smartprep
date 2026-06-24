import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import useAuth from "../hooks/useAuth.js";
import useToast from "../hooks/useToast.js";
import authService from "../services/authService.js";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/home";

  const validate = () => {
    const e = {};
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Invalid email";
    if (!formData.password) e.password = "Password is required";
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
      const res = await authService.login(formData);
      login(res.data.user, res.data.token);
      success(`Welcome back, ${res.data.user.name.split(" ")[0]}! 👋`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toastError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          Welcome back
        </h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Sign in to continue your learning journey
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
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
              placeholder="Enter your password"
              className={`form-input ${errors.password ? "form-input-error" : ""}`}
              style={{ paddingRight: 48 }}
              autoComplete="current-password"
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
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {errors.password && (
            <p style={{ color: "#ef4444", fontSize: 12, display: "flex", gap: 4 }}>
              <span>⚠</span> {errors.password}
            </p>
          )}
        </div>

        <Button
          type="submit"
          loading={loading}
          fullWidth
          style={{ marginTop: 4 }}
        >
          Sign In →
        </Button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "20px 0",
        }}
      >
        <div style={{ flex: 1, height: 1, backgroundColor: "#f1f5f9" }} />
        <span style={{ color: "#94a3b8", fontSize: 12 }}>New to SmartPrep?</span>
        <div style={{ flex: 1, height: 1, backgroundColor: "#f1f5f9" }} />
      </div>

      <Link
        to="/register"
        style={{ textDecoration: "none" }}
      >
        <button
          className="btn-secondary"
          style={{ width: "100%" }}
        >
          Create Free Account
        </button>
      </Link>
    </div>
  );
};

export default Login;